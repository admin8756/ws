import { Config, getSortKeys } from '../utils/index.js';
import { logger } from '../utils/logs.js';
import request from './request.js';

// 正式用户配置
export const USER_CONFIG = {
    name: "ljn2017",
    password: "20172017y.",
    code: '852963'
};

// 测试环境
export const USER_CONFIG_TEST = {
    name: "shoudian",
    password: "ab123456",
    code: '123456'
};

// 登录
export const login = () => {
    const userData = getNowUserInfo();
    return request.post("login/token", {
        loginName: userData.name,
        loginPwd: userData.password,
    });
}
// 获取登录信息
export const getNowUserInfo = () => {
    const typeList = {
        test: USER_CONFIG_TEST,
        prod: USER_CONFIG,
    };
    const env = Config.get('env');
    if (!typeList[env]) {
        throw new Error("请先选择环境");
    }
    return typeList[env];
};

/**
 * 一键授权
 * @param {*} code 
 * @param {*} loginType 
 * @returns 
 */

export const authorizeCfca = (code, loginType) => {
    return request.post("/sgcAuthorization/bindCook", {
        code,
        loginType
    });
};

/**
 * 根据开始日期和结束日期获取需要处理数据的日期集合
 * @param {String} sDay
 * @param {String} eDay
 */
export const getDays = (sDay, eDay) => {
    return request.get(
        `spotCommon/queryRunDate?startTime=${sDay}&endTime=${eDay}`
    );
};

/**
 * 解密获取的实时或者日前的数据
 * @param {String} caseType
 * @param {String} dateTime
 */
export const getData = async (caseType, dateTime) => {
    if (!caseType || !dateTime) {
        await logger.error(`参数错误:caseType:${caseType},dateTime:${dateTime}`)
        throw new Error('参数错误')
    }
    const postData = {
        urlCode: "loadUserPlanPriceDecodeNew",
        params: {
            dateTime,
            caseType,
        },
    };
    const { data } = await request.commonCall(postData);
    // 如果数据存在，则返回数据，否则返回空对象
    if (data) {
        const res = JSON.parse(data);
        if (res.data) {
            let { southAreaPrice, northAreaPrice } = res.data;
            const allData = await Promise.all([
                decryptData(southAreaPrice),
                decryptData(northAreaPrice),
            ]);
            southAreaPrice = getSortKeys(allData[0]);
            northAreaPrice = getSortKeys(allData[1]);
            return {
                southAreaPrice,
                northAreaPrice,
            };
        } else {
            const errMsg = `${dateTime}没有${caseType === "realtime" ? "实时" : "日前"
                }数据`;
            logger.error(errMsg);
            return {
                southAreaPrice: [],
                northAreaPrice: [],
            };
        }
    }
    return {};
};

// 判断ca授权状态
export const checkCfcaStatus = async () => {
    logger.info("开始检查CFCA授权状态");
    const { success, data } = await request.post("sgcc/commonCall/info", {
        urlCode: "info",
        params: {},
    });
    await logger[success ? 'info' : 'error'](`CFCA${success ? '已' : '未'}授权`);
    Config.set('CFCAstatus', success)
    const res = success ? JSON.parse(data) : false;
    if (!res) {
        const userData = getNowUserInfo();
        logger.info("开始一键授权CFCA");
        const caData = await authorizeCfca(userData.code, 1)
        if (caData.success) {
            return await checkCfcaStatus();
        } else {
            await logger.error("CFCA未授权,且一键授权失败");
        }
    }
    return res;
};

// 获取ukey证书编码
export const getCFCAUkey = async () => {
    const keyData = Config.get('ukey');
    try {
        if (!keyData.ukey) {
            await logger.error("ukey未缓存");
            throw new Error("ukey未缓存");
        } else {
            const { time, ukey } = keyData;
            if (new Date().getTime() - time < 1000 * 60) {
                Config.set("ukey", {
                    time: new Date().getTime(),
                    ukey,
                })
                // 更新缓存时间
                return ukey;
            } else {
                await logger.error("ukey缓存过期");
                throw new Error("ukey缓存过期");
            }
        }
    } catch (error) {
        const { data } = await commonCallSgcc({
            urlCode: "getUkeyCode",
        });
        const ukey = JSON.parse(data).data;
        Config.set('ukey', {
            time: new Date().getTime(),
            ukey,
        })
        return ukey;
    }
};

// 获取公钥
export const getPublicKey = async () => {
    const { data } = await commonCallSgcc({
        urlCode: 'getPubKey'
    })
    return JSON.parse(data).msg
}
// mos加密
export const encryptMos = async (publicKey, msg) => {
    if (!publicKey || !msg) throw new Error('参数错误')
    const { data } = await request.post('encipher/mosEnergy', { publicKey, msg })
    return data || {}
}
// 日前加密
export const encryptDayAhead = async msg => {
    const { data } = await request.post('encipher/dayAheadEncrypt', { msg })
    return data || {}
}
/**
 * 获取实时或者日前的数据
 */
export const commonCallSgcc = (data) => request.post(`sgcc/commonCall/${data.urlCode}`, data);

// 现货公开新增接口
export const spotCommonAdd = (addData) => {
    return request.post("spotCommon/add", addData);
};
/**
 * @name decryptData 解密接口
 * @param {Object} postData 解密数据
 * @returns {Object} 解密后的数据
 * @description: 解密接口
  */
export const decryptData = async (encryptData) => {
    const { data } = await request.post('encipher/decrypt', { encryptData })
    if (data) {
        return JSON.parse(data)
    } else {
        return ''
    }
}

// 获取用户信息
export const getUserInfo = async () => {
    const { data } = await request.post('user/info', {});
    return data
}

// 检查是否导入密钥
export const checkKeyImport = async () => {
    const { success } = await request.get('decode/getStatus')
    return success || false
}