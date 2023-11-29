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