import dayjs from 'dayjs';
import { logger } from '../utils/logs';
import { Config, getDateArray, getFutureDateArray } from '../utils/index';
import { login, getUserInfo, checkCfcaStatus, getData, checkKeyImport, spotCommonAdd, getDays } from './api';

// 定时器
let timer = null

export const runScript = async () => {
  try {
    if (timer) {
      logger.info('定时器已存在，清除定时器')
      clearInterval(timer)
    }
    logger.info('脚本开始运行')
    Config.set('serviceTime', new Date())
    // 更新脚本运行状态
    Config.set('runStatus', true)
    logger.info('检查token是否存在')
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
    logger.info('检查CFCA授权状态')
    await checkCfcaStatus()

    if (!Config.get('runStatus')) {
      throw await logger.warn('CFCA授权失败,运行失败')
    }

    logger.info('检查CFCA密钥是否导入')
    await checkCFCAKey()
    if (!Config.get('cfcaKeyImport')) {
      throw await logger.warn('CFCA密钥未导入，运行失败')
    }

    logger.info('脚本运行环境检查完毕，准备运行脚本')
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
        getDisclosureInfo(startDate, endDate)
        getRealtimeInfo(startDate, endDate)
      }
    }
    if (mode === 'realTime') {
      getDisclosureInfo()
      getRealtimeInfo()
      // 定时器获取实时数据
      timer = setInterval(async () => {
        await logger.info("成功心跳一次")
        Config.set('heartStatus', true)
        Config.set('heartLastDate', new Date())
        getDisclosureInfo()
        getRealtimeInfo()
      }, Config.get('heartTime') * 1000)
    }
    logger.info('脚本运行结束')
  } catch (error) {
    await logger.error(`脚本运行失败：${JSON.stringify(error)}`)
    return '脚本运行失败'
  }
}

// 查询定时器是否在运行
export const queryScript = Boolean(timer)

// 取消定时器运行
export const closeScript = () => {
  if (timer) {
    logger.info('关闭定时器')
    clearInterval(timer)
    timer = null
    return `定时器取消成功`
  } else {
    return '定时器没有开启'
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
      Config.set('logged', true)
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
    return await getRange(startDate, endDate, 'dayahead')
  } else {
    const dateList = getFutureDateArray(3)
    for (let i = 0; i < dateList.length; i++) {
      const res = await getOne(dateList[i], 'dayahead')
      if (!res) {
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
    return await getRange(startDate, endDate, 'realtime')
  } else {
    await getOne(dayjs(new Date()).format('YYYY-MM-DD'), 'realtime')
  }
}

// 获取单个日期
export const getOne = async (day, type) => {
  await logger.info(`获取单条数据，日期：${day} 类型：${type}`)
  if (!day) {
    await logger.error(`获取的日期不能为空，当前日期：${day}`)
  } else if (!dayjs(day).isValid()) {
    await logger.error(`获取的日期不合法，当前日期：${day}`)
  } else {
    const date = dayjs(day).format('YYYY-MM-DD')
    const res = await getData(type, date)
    if (res.southAreaPrice || res.northAreaPrice) {
      await sendToServer({
        date: day,
        [`${type}`]: res
      })
      return true
    } else {
      return false
    }
  }
}

// 获取时间段
export const getRange = async (startDate, endDate, type) => {
  if (!startDate || !endDate) {
    await logger.error(`获取的日期不能为空，当前日期：${startDate} - ${endDate}`)
  } else if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
    await logger.error(`获取的日期不合法，当前日期：${startDate} - ${endDate}`)
  } else {
    // !! 通过判断是否覆盖 检查日期是否已经存在
    let datesInRange = []
    if (Config.get('skipDate')) {
      // 查询两个日期之间没有数据的天数
      logger.info(`补全数据模式，将会补全服务器中${startDate} - ${endDate}的${type}数据`)
      datesInRange = await getDays(startDate, endDate)
      logger.info(`补全日期： ${JSON.stringify(datesInRange)}`)
    } else {
      logger.info(`覆盖数据模式，将会覆盖服务器中${startDate} - ${endDate}的${type}数据`)
      datesInRange = getDateArray(startDate, endDate)
      logger.info(`覆盖日期： ${JSON.stringify(datesInRange)}`)
    }
    for (let i = 0; i < datesInRange.length; i++) {
      const date = datesInRange[i];
      await getOne(date, type)
    }
  }
}

// 检查密钥是否导入
export const checkCFCAKey = async () => {
  const cfcaKey = await checkKeyImport()
  await logger[cfcaKey ? 'info' : 'error'](cfcaKey ? '现货密钥已导入' : '现货密钥没有导入')
  Config.set('cfcaKeyImport', cfcaKey)
};

// 将处理好的数据发送给后端
export const sendToServer = async (data) => {
  logger.info(JSON.stringify(data))
  const postData = {
    runDate: data.date,
    // 江南实时出清价
    voidanceSouth: data && data.realtime && data.realtime.southAreaPrice || [],
    // 江北实时出清价
    voidanceNorth: data && data.realtime && data.realtime.northAreaPrice || [],
    // 江南日前出清价
    presentSouth: data && data.dayahead && data.dayahead.southAreaPrice || [],
    // 江北日前出清价
    presentNorth: data && data.dayahead && data.dayahead.northAreaPrice || [],
  };
  const { success } = await spotCommonAdd(postData)
  await logger[success ? "info" : "error"](
    `${data.date} 提交${success ? "成功" : "失败"}`
  );
}

