import axios from "axios";
import { Config } from '../utils/index.js';
import { httpLogger, logger } from "../utils/logs.js";

const TEST_ENV = 'https://test.linkcloud-energy.com/prod-api/';
const PROD_ENV = 'https://sys.linkcloud-energy.com/prod-api/';

const STATUS_CODE = {
    400: "客户端请求的语法错误，服务器无法理解",
    401: "请求要求用户的身份认证",
    403: "服务器理解请求客户端的请求，但是拒绝执行此请求",
    404: "服务器无法根据客户端的请求找到资源",
    405: "客户端请求中的方法被禁止",
    408: "接口响应超时",
    500: "服务器内部错误，无法完成请求",
    501: "服务器不支持请求的功能，无法完成请求",
    502: "代理工作的服务器收到了无效的响应",
    503: "超载或系统维护,系统暂时的无法处理请求",
    505: "服务器不支持请求的HTTP协议的版本",
};

const baseURL = Config.get('env') ? TEST_ENV : PROD_ENV;

const service = axios.create({
    baseURL,
    timeout: 120 * 10000,
});

service.interceptors.request.use(
    (config) => {
        config.headers.user_token = Config.get('token') || '';
        return config;
    },
);

service.interceptors.response.use(
    (response) => {
        const { config, data } = response;
        httpLogger.info(`${config.baseURL}${config.url}`, JSON.stringify(data));
        if (data && data.code !== 0) {
            if (data.msg === "token is null") {
                // 处理登录失效
                logger.error("登录失效，退出");
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    process.exit(0);
                }, 1000);
            }
        }
        return data;
    },
    (error) => {
        const { status, request, data, config } = error.response || {};
        if (status || request) {
            const errorLog = {
                error: STATUS_CODE[status] || '未知',
                responseURL: config.url,
            };
            httpLogger.error(`调用${config.url}失败 【${status}】${errorLog.error} ${data.error}`);
        }
    }
);

service.commonCall = (data) => service.post(`sgcc/commonCall/${data.urlCode}`, data);
export default service;