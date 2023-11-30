import { logger } from '../utils/logs';
import { Config } from '../utils/index';

export const runScript = async () => {
    // 更新脚本运行时间
    logger.info('脚本开始运行')
    Config.set('serviceTime', new Date())
    // 更新脚本运行状态
    Config.set('runStatus', true)
    // 更新登录信息
    // Config.set('logged',)
    return '运行完成'
}
export const login = async () => {

}