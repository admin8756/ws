import fs from 'fs';
/**
 * 格式化日志
 * @param {string} logs - 日志字符串
 * @returns {Array} 格式化后的日志数组
 */
export const formatLog = (logs) => {
    let logEntries = logs.split('\n');
    logEntries = logEntries.map((log) => log.replace(/\r/g, ''));
    return logEntries.map((log) => {
        const match = log.match(/^\[(.*?)\] \[([^\]]+)\] ([^\s]+) - (.*)$/);
        if (!match) {
            return {};
        }
        return {
            time: match[1].replace(/\[|\]/g, ''),
            level: match[2],
            type: match[3],
            msg: match[4].trim(),
        };
    }).filter((log) => log.msg);
};
const jsonPath = './utils/config.json'
// 生成一个代理对象，提供一个读取方法，返回config.json的配置。监听改变如果改变了。更新config.json文件
export const Config = {
    get() {
        // 判断文件是否存在
        if (!fs.existsSync(jsonPath)) {
            fs.writeFileSync(jsonPath, JSON.stringify({}));
        }
        return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    },
    set(key, value) {
        const config = this.get();
        const newConfig = Object.assign(config, { [key]: value });
        fs.writeFileSync(jsonPath, JSON.stringify(newConfig, null, 2));
    },
    watch(callback) {
        fs.watchFile(jsonPath, { interval: 1000 }, () => {
            callback(this.get());
        });
    },
}