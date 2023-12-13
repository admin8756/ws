import fs from 'fs';
import dayjs from 'dayjs';
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
  onChange(callback) {
    fs.watchFile(jsonPath, { interval: 1000 }, () => {
      callback(this.get());
    })
  },
  get(key) {
    // 判断文件是否存在
    if (!fs.existsSync(jsonPath)) {
      fs.writeFileSync(jsonPath, JSON.stringify({}));
    }
    const con = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (key) {
      return con[key] ? con[key] : undefined
    } else {
      return con
    }
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
// 将对象的key只保留数字，然后排序，然后转成数组
export const getSortKeys = (obj = {}) => {
  // 判断是否是对象
  if (Object.prototype.toString.call(obj) !== "[object Object]") {
    return [];
  }
  const getN = (str) => (str.match(/\d+/, "g") || [])[0] || 0;
  const keys = Object.keys(obj);
  const newKeys = keys.sort((a, b) => getN(a) - getN(b));
  return newKeys.map((key) => obj[key]);
};
export const TIME_STYLE = {
  year: 'YYYY',
  month: 'MM',
  day: 'DD',
  ym: 'YYYY-MM',
  sf: 'HH:mm',
  sfm: 'HH:mm:ss',
  nyr: 'YYYY-MM-DD',
  nyrsf: 'YYYY-MM-DD HH:mm',
  nyrsfm: 'YYYY-MM-DD HH:mm:ss',
  nyrsfmZh: 'YYYY年MM月DD日 HH:mm:ss',
  systemTime: 'MM月DD日 HH:mm:ss -SSS'
}

/**
 * @name getTimes 停止每次没有意义的格式化
 * @param {*} timeStyle 请从config里的TIME_STYLE读取
 * @param {*} t 要格式化的时间。或者空则返回现在的时间
 * @returns 格式化好的时间
 */
export const getTimes = (timeStyle, t) => {
  const checkTime = t => (dayjs(t).isValid() ? t : new Date())
  return dayjs(checkTime(t)).format(timeStyle || TIME_STYLE.nyrsfm)
}

export const formatDate = {
  year: (t, timeStyle = 'YYYY') => getTimes(timeStyle, t),
  month: (t, timeStyle = 'MM') => getTimes(timeStyle, t),
  day: (t, timeStyle = 'DD') => getTimes(timeStyle, t),
  ym: (t, timeStyle = 'YYYY-MM') => getTimes(timeStyle, t),
  ymd: (t, timeStyle = 'YYYY-MM-DD') => getTimes(timeStyle, t),
  hm: (t, timeStyle = 'HH:mm') => getTimes(timeStyle, t),
  hms: (t, timeStyle = 'HH:mm:ss') => getTimes(timeStyle, t),
  ymdhm: (t, timeStyle = 'YYYY-MM-DD HH:mm') => getTimes(timeStyle, t),
  ymdhms: (t, timeStyle = 'YYYY-MM-DD HH:mm:ss') => getTimes(timeStyle, t),
  ymdhmsZh: (t, timeStyle = 'YYYY年MM月DD日 HH:mm:ss') => getTimes(timeStyle, t),
  systemTime: (t, timeStyle = 'MM月DD日 HH:mm:ss -SSS') => getTimes(timeStyle, t)
}
/**
 * @name objToArr 对象转数组
 * @param {Object} obj 对象
 * @returns {Array} 数组
 */
export const objToArr = (obj = {}) => {
  const arr = []
  for (const key in obj) {
    arr.push(obj[key])
  }
  return arr
}

/**
 * @name getArrayFixed 传入一个数组，传入要保留的小数点位数
 * @param {Array} arr 数组
 * @param {Number} num 保留的小数点位数
 * @returns {Array} 返回一个新的数组
 */
export const getArrayFixed = (arr = [], num = 4) => {
  // 判断是否是数组
  if (!(arr instanceof Array)) {
    return arr
  } else {
    return arr.map(item => {
      // 如果是数字或是字符串，处理，否则不处理
      if (typeof item === 'number' || typeof item === 'string') {
        return Number(item).toFixed(num).padEnd(num, '0')
      } else {
        return item
      }
    })
  }
}

// 传入一个开始日期，结束日期。返回日期的数组
export const getDateArray = (startDate, endDate) => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  const diff = end.diff(start, 'day');
  return Array.from({ length: diff + 1 }, (_, index) =>
    start.add(index, 'day').format('YYYY-MM-DD')
  );
}
// 获取未来指定天数的数组
export const getFutureDateArray = (num) => {
  const start = dayjs();
  return Array.from({ length: num }, (_, index) =>
    start.add(index, 'day').format('YYYY-MM-DD')
  );
}
