import { logger } from '../utils/logs';
import { Config } from '../utils/index';
import { login, getUserInfo } from './api';

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
    logger.info('脚本运行结束')
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