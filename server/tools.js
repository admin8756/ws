import { logger } from '../utils/logs';
import { Config } from '../utils/index';
import { login, getUserInfo, checkCfcaStatus } from './api';

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
        return logger.info('cfca授权失败,暂停运行')
    }
    logger.info('脚本运行结束')
    // 测试解密可用性

    // 开始定时任务

    // 更新脚本运行状态

    return `脚本运行结束`
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
        } else {
            logger.error('登录失败，获取token失败')
            Config.set('token', '')
        }
    } catch (error) {
        logger.error(error)
        Config.set('runStatus', false)
    }
}