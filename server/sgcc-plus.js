
import { getArrayFixed, formatDate, objToArr, Config } from '../utils/index.js'
import { logger } from '../utils/logs'
import { encryptDayAhead, encryptMos, getCFCAUkey, getPublicKey, decryptData } from './api.js'
const sgccPlus = {
    // ws对象
    ws: null,
    // ws链接地址
    wsUrl: 'ws://127.0.0.1:18084/websocket/1',
    // 心跳定时器
    heartBeatTimer: null,
    // 链接类型
    protocol: 'cryptokit-kdets-protocol',
    // 超时时间
    timeoutNum: 10000,
    // ws状态
    wsStatus: false,
    statusList: {
        0: { name: 'CONNECTING', info: '正在连接' },
        1: { name: 'OPEN', info: '已连接' },
        2: { name: 'CLOSING', info: '正在关闭' },
        3: { name: 'CLOSED', info: '已关闭' }
    },
    taskList: new Proxy(
        {},
        {
            set(target, key, value) {
                target[key] = value
                // 检测到有任务添加，开始发送target[key]msg
                if (sgccPlus.wsStatus) {
                    sgccPlus.ws.send(JSON.stringify(target[key].msg))
                } else {
                    // 如果ws链接失败。则立即返回false。
                    target[key].resolve('')
                    delete target[key]
                }
                return true
            },
            get(target, key) {
                return target[key]
            },
            deleteProperty(target, key) {
                delete target[key]
                return true
            }
        }
    ),
    messageList: new Proxy(
        {},
        {
            set(target, key, value) {
                target[key] = value
                return true
            },
            get(target, key) {
                return target[key]
            },
            deleteProperty(target, key) {
                delete target[key]
                return true
            }
        }
    ),
    init() {
        if (!this.ws) {
            clearTimeout(sgccPlus.heartBeatTimer)
            this.ws = new WebSocket(this.wsUrl)
            this.ws.onopen = this.onopen
            this.ws.onmessage = this.onmessage
            this.ws.onclose = this.onclose
            this.ws.onerror = this.onerror
            // 定时5秒，如果ws链接失败，则提示用户链接失败。
            setTimeout(() => {
                !sgccPlus.wsStatus && logger.warn('解密工具链接超时')
            }, 5000)
        } else {
            sgccPlus.wsStatus = true
        }
    },
    // 当链接成功时，开始心跳任务
    onopen() {
        sgccPlus.wsStatus = true
        Config.set('CFCAstatus', true)
        sgccPlus.heartBeat()
    },
    // 消息处理
    onmessage: e => {
        const data = JSON.parse(e.data)
        if (+data.sid === 1 && data.data !== '连接成功') {
            sgccPlus.messageList[data.flag] = data.data
        } else {
            throw new Error(data.data)
        }
    },
    // 链接关闭
    onclose() {
        sgccPlus.wsStatus = false
        // 停止心跳任务
        clearTimeout(sgccPlus.heartBeatTimer)
        logger.error('ws链接关闭')
    },
    // 链接错误
    onerror() {
        sgccPlus.wsStatus = false
        logger.error('ws链接错误')
        // 停止心跳任务
        Config.set('CFCAstatus', false)
        clearTimeout(sgccPlus.heartBeatTimer)
    },
    // 心跳任务
    heartBeat() {
        sgccPlus.heartBeatTimer = setTimeout(() => {
            sgccPlus.init()
            sgccPlus.heartBeat()
        }, Config.get('refreshTimeCfca') * 1000)
    },
    // 添加任务
    addTask: msg => {
        return decryptData(msg)
    },
    /**
     * 解密方法
     * @param {Array} data 要解密的数据
     * @param {String} type 解密数据的类型
     * @returns {Promise} 解密后的结果
     */

    decrypt: async (data, type) => {
        const cfcaUkey = await getCFCAUkey()
        const typeList = {
            // 解密不包含时间的方法
            decryptDataNoTime: async decryptData => {
                if (!sgccPlus.checkDecrypt({ cfcaUkey, decryptData })) {
                    return false
                }
                const flag = ''
                const msg = { type: 'decrypt', isHistory: 1, effective_date: formatDate.ymd(), data: decryptData, flag, ukeyCode: cfcaUkey }
                return await sgccPlus.addTask(msg)
            },
            // 解密包含时间的方法
            decryptData: async (decryptData, currDt) => {
                if (!sgccPlus.checkDecrypt({ cfcaUkey, decryptData, currDt })) {
                    return false
                }
                const flag = ''
                const msg = {
                    type: 'decrypt',
                    isHistory: 1,
                    effective_date: currDt,
                    data: decryptData,
                    flag,
                    ukeyCode: cfcaUkey
                }
                return await sgccPlus.addTask(msg)
            },
            // 解密报价合集(传入数组)
            decryptDayAheadData: async (encryptData = []) => {
                if (!sgccPlus.checkDecrypt({ cfcaUkey, encryptData, length: encryptData.length })) {
                    return []
                }
                return await Promise.all(
                    encryptData.map(async item => {
                        const { startPoint, endPoint, buyQuotation, updateDate, type } = item
                        const currDt = formatDate.ymd(updateDate)
                        const [buy, start, end] = await Promise.all([
                            sgccPlus.decrypt.decryptData(buyQuotation, currDt),
                            sgccPlus.decrypt.decryptData(startPoint, currDt),
                            sgccPlus.decrypt.decryptData(endPoint, currDt)
                        ])
                        return {
                            buyQuotation: buy,
                            startPoint: start,
                            endPoint: end,
                            type
                        }
                    })
                )
            },
            // 解密江南江北分区价格
            parseEncryptData: async encryptData => {
                if (!sgccPlus.checkDecrypt({ cfcaUkey, encryptData })) {
                    return new Array(96).fill('0.000')
                } else {
                    const encryptList = encryptData.map(item => sgccPlus.decrypt.decryptDataNoTime(item))
                    const list = await Promise.all(encryptList)
                    const data = list.map(item => objToArr(item))
                    // * 相同下标求和(非常奇怪的需求)
                    for (let j = 0; j < 96; j++) {
                        encryptData[j] = 0;
                        data.forEach(item => {
                            encryptData[j] += item[j];
                        });
                    }
                    return getArrayFixed(encryptData, 3)
                }
            }
        }
        return typeList[type] ? typeList[type](data) : false
    },
    /**
     * 加密方法
     * @param {Array} data 要加密的数据
     * @param {String} type 加密数据的类型
     * @returns {Promise} 加密后的结果
     */
    encrypt: async (data, type) => {
        const cfcaUkey = await getCFCAUkey()
        const cfcaKey = await getPublicKey()
        const typeList = {
            // sm2加密不管两个方案。都使用服务器加密
            encryptSm2: txtRawData => {
                txtRawData = JSON.stringify(txtRawData)
                // 字符串去除空格
                txtRawData = txtRawData.replace(/\s+/g, '')
                // 字符串去除双引号
                txtRawData = txtRawData.replace(/"/g, '')
                return new Promise((resolve, reject) => {
                    encryptMos(cfcaKey, txtRawData)
                        .then(res => {
                            resolve(res)
                        })
                        .catch(err => {
                            reject(err)
                        })
                })
            },
            // 新版加密方法
            encryptData: async txtRawData => {
                // const publicKey = await getPublicKey()
                const cfcaUkey = await getCFCAUkey()
                if (!sgccPlus.checkDecrypt({ cfcaUkey, txtRawData })) {
                    return false
                }
                return encryptDayAhead(txtRawData)
            },
            // 加密报价合集(传入数组)
            encryptDayAheadData: async encryptData => {
                if (!sgccPlus.checkDecrypt({ cfcaUkey, encryptData, length: encryptData.length })) {
                    return false;
                }
                const encryptList = encryptData.map(async item => {
                    const { startPoint, endPoint, buyQuotation, updateDate } = item;
                    const currDt = formatDate.ymd(updateDate);
                    const [buy, start, end] = await Promise.all([
                        sgccPlus.encrypt.encryptData(buyQuotation, currDt),
                        sgccPlus.encrypt.encryptData(startPoint, currDt),
                        sgccPlus.encrypt.encryptData(endPoint, currDt)
                    ]);

                    return {
                        buyQuotation: buy,
                        startPoint: start,
                        endPoint: end
                    };
                });

                return await Promise.all(encryptList);
            }
        }

        return typeList[type] ? typeList[type](data) : false
    },
    /**
     * 检查是否具有解密条件
     * @param {Object} data 要检查的数据
     * @returns {Boolean} 是否具有解密条件
     */
    checkDecrypt(data) {
        // 循环对象，如果有一个值为空，则返回false
        for (const key in data) {
            if (!data[key]) {
                return false
            }
        }
        return true
    },
    // 生成96关键点数据,分成12个数组
    getKeyData: () => {
        const [arr, newArr] = [[], []]
        for (let i = 3; i <= 288; i += 3) {
            arr.push(i)
        }
        for (let i = 0; i < arr.length; i += 8) {
            newArr.push(arr.slice(i, i + 8))
        }
        return newArr
    },
    // 96点的数组
    generateKeyArray: name => {
        const arr = []
        for (let i = 3; i <= 288; i += 3) {
            arr.push(i)
        }
        if (name) {
            return arr.map(item => {
                return {
                    [`${name}${item}`]: ''
                }
            })
        } else {
            return arr
        }
    }
}
// 解密方法
sgccPlus.decrypt.decryptDataNoTime = async decryptData => {
    const cfcaUkey = await getCFCAUkey()
    if (!sgccPlus.checkDecrypt({ cfcaUkey, decryptData })) {
        return false
    }
    const flag = ''
    const msg = { type: 'decrypt', isHistory: 1, data: decryptData, flag, ukeyCode: cfcaUkey }
    return await sgccPlus.addTask(msg)
}
sgccPlus.decrypt.decryptData = async (decryptData, currDt) => {
    const cfcaUkey = await getCFCAUkey()
    if (!sgccPlus.checkDecrypt({ cfcaUkey, decryptData, currDt })) {
        return false
    }
    const flag = ''
    const msg = {
        type: 'decrypt',
        isHistory: 1,
        effective_date: currDt,
        data: decryptData,
        flag,
        ukeyCode: cfcaUkey
    }
    return await sgccPlus.addTask(msg)
}
sgccPlus.decrypt.decryptDayAheadData = async (decryptData = []) => {
    const cfcaUkey = await getCFCAUkey()
    if (!sgccPlus.checkDecrypt({ cfcaUkey, decryptData, length: decryptData.length })) {
        return false
    }
    return await Promise.all(
        decryptData.map(async item => {
            const { startPoint, endPoint, buyQuotation, updateDate, type } = item
            const currDt = formatDate.ymd(updateDate)
            const decryptList = [sgccPlus.decrypt.decryptData(buyQuotation, currDt), sgccPlus.decrypt.decryptData(startPoint, currDt), sgccPlus.decrypt.decryptData(endPoint, currDt)]
            const [buy, start, end] = await Promise.all(decryptList)
            return {
                buyQuotation: buy,
                startPoint: start,
                endPoint: end,
                type
            }
        })
    )
}
sgccPlus.decrypt.parseEncryptData = async encryptData => {
    const cfcaUkey = await getCFCAUkey()
    if (!sgccPlus.checkDecrypt({ cfcaUkey, encryptData })) {
        return new Array(96).fill('0.000')
    } else {
        const encryptList = encryptData.map(item => sgccPlus.decrypt.decryptDataNoTime(item))
        const list = await Promise.all(encryptList)
        const data = list.map(item => objToArr(item))
        // * 相同下标求和(非常奇怪的需求)
        for (let j = 0; j < 96; j++) {
            encryptData[j] = 0;
            data.forEach(item => {
                encryptData[j] += item[j];
            });
        }
        return getArrayFixed(encryptData, 3)
    }
}
// 加密方法
sgccPlus.encrypt.encryptSm2 = async txtRawData => {
    txtRawData = JSON.stringify(txtRawData)
    // 字符串去除空格
    txtRawData = txtRawData.replace(/\s+/g, '')
    // 字符串去除双引号
    txtRawData = txtRawData.replace(/"/g, '')
    const cfcaKey = await getPublicKey()
    return encryptMos(cfcaKey, txtRawData)
}
sgccPlus.encrypt.encryptData = encryptData => {
    return encryptDayAhead(encryptData)
}
sgccPlus.encrypt.encryptDayAheadData = async encryptData => {
    const cfcaUkey = await getCFCAUkey()
    if (!sgccPlus.checkDecrypt({ cfcaUkey, encryptData, length: encryptData.length })) {
        return false
    }
    return await Promise.all(
        encryptData.map(async item => {
            const { startPoint, endPoint, buyQuotation, updateDate } = item
            const currDt = formatDate.ymd(updateDate)
            const encryptList = [sgccPlus.encrypt.encryptData(startPoint, currDt), sgccPlus.encrypt.encryptData(endPoint, currDt), sgccPlus.encrypt.encryptData(buyQuotation, currDt)]
            const [start, end, buy] = await Promise.all(encryptList)
            return {
                ...item,
                buyQuotation: buy,
                startPoint: start,
                endPoint: end
            }
        })
    )
}

export default sgccPlus
