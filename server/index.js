import { Config, formatLog } from '../utils/index';
import { queryScript, runScript } from './tools.js';

// index.js
const fs = require('fs');

// 用户类
class User {
  static login(data) {
    const { passWord } = data
    const response = {
      success: false,
      msg: "登录成功"
    }
    if (!passWord) {
      response.msg = '密码不能为空'
    }
    const pwd = Config.get('passWord') || '123456'
    if (pwd !== passWord) {
      response.msg = '密码错误'
    }
    response.success = `${pwd}` === `${passWord}`
    return response
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
  static init() {
    return runScript()
  }

  static timerStatus() {
    return queryScript
  }

  static state() {
    return Config.get()
  }

  static saveConfig(configData) {
    try {
      for (const key in configData) {
        if (Object.hasOwnProperty.call(configData, key)) {
          const value = configData[key];
          Config.set(key, value)
        }
      }
      return true
    } catch (error) {
      return false
    }
  }
}

export default {
  User,
  Logs,
  Tools
};
