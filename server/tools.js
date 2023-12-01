import { logger } from '../utils/logs';
import { Config } from '../utils/index';
import { login } from './api';

export const runScript = () => {
    // 更新脚本运行时间
    logger.info('脚本开始运行')
    Config.set('serviceTime', new Date())
    // 更新脚本运行状态
    Config.set('runStatus', true)
    // 更新登录信息
    logger.info('开始登录')
    return login()
}
