import dayjs from 'dayjs';
import { logger } from '../utils/logs';
import { Config } from '../utils/index';
import { login, getUserInfo, checkCfcaStatus, getData, checkKeyImport } from './api';

// 定时器
let timer = null

export const runScript = async () => {
    // 更新脚本运行时间
    logger.info('脚本开始运行')
    Config.set('serviceTime', new Date())
    // 更新脚本运行状态
    Config.set('runStatus', true)
    // 检查token是否存在
    if (!Config.get('token')) {
        await tryLogin()
    } else {
        const userInfo = await getUserInfo()
        if (userInfo.userName) {
            logger.info(`登录成功，用户名：${userInfo.userName}`)
        } else {
            await tryLogin()
            logger.error('登录失败，获取用户信息失败')
            Config.set('runStatus', false)
        }
    }
    // 检查cfca授权状态
    await checkCfcaStatus()

    if (!Config.get('runStatus')) {
        throw await logger.warn('CFCA授权失败,运行失败')
    }
    // 检查密钥是否导入
    await checkCFCAKey()
    if (!Config.get('cfcaKeyImport')) {
        throw await logger.warn('CFCA密钥未导入，运行失败')
    }
    const mode = Config.get('mode')
    if (mode === '' || mode === -1) {
        throw await logger.warn('未设置运行模式,运行失败')
    }
    if (mode !== 'history' && mode !== 'realTime') {
        throw await logger.warn('运行模式不正确,运行失败')
    }
    if (mode === 'history') {
        // 获取历史数据
        const startDate = Config.get('startDate')
        const endDate = Config.get('endDate')
        if (!startDate || !endDate) {
            throw await logger.warn('请先设置开始日期和结束日期')
        } else {
            await getDisclosureInfo(startDate, endDate)
            await getRealtimeInfo(startDate, endDate)
        }
    }
    if (mode === 'realTime') {
        if (timer) {
            logger.info('定时器已存在，清除定时器')
            clearInterval(timer)
        }
        // 定时器获取实时数据
        timer = setInterval(async () => {
            logger.info("成功心跳一次")
            Config.set('heartStatus', true)
            Config.set('heartLastDate', new Date())
            await getDisclosureInfo()
            await getRealtimeInfo()
        }, Config.get('heartTime') * 1000)
    }
    logger.info('脚本运行结束')
}

// 查询定时器是否在运行
export const queryScript = Boolean(timer)

// 取消定时器运行
export const closeScript = () => {
    if (timer) {
        logger.info('关闭定时器')
        clearInterval(timer)
        timer = null
    }
}
// 尝试登录
export const tryLogin = async () => {
    logger.info('开始登录')
    try {
        const { data } = await login()
        logger.info(data)
        if (data.user_token) {
            logger.info(`设置token成功:${data.user_token}`)
            Config.set('token', data.user_token)
            Config.set('logged', false)
        } else {
            throw new Error('登录失败，获取token失败')
        }
    } catch (error) {
        logger.error(error)
        Config.set('token', '')
        Config.get('logged', false)
        Config.set('runStatus', false)
    }
}

// 日前信息披露信息查询。
export const getDisclosureInfo = async (startDate, endDate) => {
    if (startDate && endDate) {
        // 判断开始日期和结束日期是否相同
        if (startDate === endDate) {
            return await getOne(startDate, 'dayahead')
        }
        // 开始日期是否大于结束日期
        if (startDate > endDate) {
            return logger.error('开始日期不能大于结束日期')
        }
        // 查询时间区间的信息披露
        const getRange = async (startDate, endDate) => {
            const data = []
            for (let i = startDate; i <= endDate; i++) {
                const res = await getOne(i, 'dayahead')
                if (res) {
                    data.push(res)
                } else {
                    break
                }
            }
            return data
        }
        return await getRange(startDate, endDate)
    } else {
        const data = []
        // 查询D+1,如果D+1有数据，则查询D+2,如果D+2有数据，则查询D+3，以此类推，直到查询9天的数据
        for (let i = 0; i < 9; i++) {
            const res = await getOne(dayjs().add(i, 'day').format('YYYY-MM-DD'))
            if (res) {
                data.push(res)
            } else {
                break
            }
        }
    }
}

// 实时信息披露查询
export const getRealtimeInfo = async (startDate, endDate) => {
    if (startDate && endDate) {
        // 判断开始日期和结束日期是否相同
        if (startDate === endDate) {
            return await getOne(startDate, 'realtime')
        }
        // 开始日期是否大于结束日期
        if (startDate > endDate) {
            throw logger.error('开始日期不能大于结束日期')
        }
        // 查询时间区间的信息披露
        const getRange = async (startDate, endDate) => {
            const data = []
            for (let i = startDate; i <= endDate; i++) {
                const res = await getOne(i, 'realtime')
                data.push(res)
            }
            return data
        }
        return await getRange(startDate, endDate)
    } else {
        const data = []
        // 查询D+1,如果D+1有数据，则查询D+2,如果D+2有数据，则查询D+3，以此类推，直到查询9天的数据
        for (let i = 0; i < 9; i++) {
            const res = await getOne(dayjs().add(i, 'day').format('YYYY-MM-DD'))
            if (res) {
                data.push(res)
            } else {
                break
            }
        }
    }
}

// 获取单个日期
export const getOne = async (day, type) => {
    if (!day) {
        await logger.error(`获取的日期不能为空，当前日期：${day}`)
    } else if (!dayjs(day).isValid()) {
        await logger.error(`获取的日期不合法，当前日期：${day}`)
    } else {
        const date = dayjs(day).format('YYYY-MM-DD')
        return await getData(date, type)
    }
}

// 获取时间段
export const getRange = async (startDate, endDate, type) => {
    const getDatesInRange = (startDate, endDate) => {
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const dates = [];
        let current = start;
        while (current.isSameOrBefore(end)) {
            dates.push(current.format('YYYY-MM-DD'));
            current = current.add(1, 'day');
        }
        return dates;
    }

    if (!startDate || !endDate) {
        await logger.error(`获取的日期不能为空，当前日期：${startDate} - ${endDate}`)
    } else if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
        await logger.error(`获取的日期不合法，当前日期：${startDate} - ${endDate}`)
    } else {
        const datesInRange = getDatesInRange(startDate, endDate);
        for (let i = 0; i < datesInRange.length; i++) {
            const date = datesInRange[i];
            await getData(date, type)
        }
        // 利用dayjs循环获得start 到 end 每一天的日期
    }
}

// 检查密钥是否导入
export const checkCFCAKey = async () => {
    const cfcaKey = await checkKeyImport()
    await logger[cfcaKey ? 'info' : 'error'](cfcaKey ? '现货密钥已导入' : '现货密钥没有导入')
    Config.set('cfcaKeyImport', cfcaKey)
};