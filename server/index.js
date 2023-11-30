import { Config, formatLog } from '../utils/index';
import { runScript } from './tools.js';
// index.js
const fs = require('fs');

// 用户类
class User {
  static getUser(id) {
    return { id, name: 'John Doe' };
  }
}
// 日志类
class Logs {
  /**
   * 查询日志列表
   * @param {String} type 日志类型 
   * @param {String} date 
   * @returns 
   */
  static getLogList(type, date) {
    const typeList = ['access', 'app', 'errors']
    // 检查type是否存在于typeList中
    if (type && !typeList.includes(type)) {
      throw new Error('type not found');
    }
    // 获取logs目录下的所有文件
    let list = fs.readdirSync('./logs');
    if (type) {
      list = list.filter((file) => ~file.indexOf(type));
    }
    // 判断日期是否合法
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('date format error');
    }
    if (date) {
      list = list.filter((file) => ~file.indexOf(date));
    }
    return list;
  }
  static getLog(name) {
    const filePath = `./logs/${name}`;
    // 判断文件是否存在
    if (!fs.existsSync(filePath)) {
      throw new Error('file not found');
    }
    const log = fs.readFileSync(filePath, 'utf-8')
    const list = formatLog(log)
    return list
  }
}

// 工具类
class Tools {
  static async init() {
    const res = await runScript()
    return res
  }
  static state() {
    return Config.get()
  }
}

export default {
  User,
  Logs,
  Tools
};
