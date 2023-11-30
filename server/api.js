import axios from "axios";
import { Config } from "@/utils";
const TEST_ENV = 'https://test.linkcloud-energy.com/prod-api/'
const PROD_ENV = 'https://sys.linkcloud-energy.com/prod-api/'
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
export const USER_CONFIG_TEST = {
    name: "shoudian",
    password: "ab123456",
    code: '123456'
};
const baseURL = Config.get('env') === 0 ? TEST_ENV : PROD_ENV
const server = new axios.create({
    url: baseURL,
    timeout: 120 * 10000,
});

service.interceptors.response.use(
    (response) => {
        logger.info(`${getEnv()}${response.config.url}`);
        const res = response.data;
        if (res && res.code !== 0) {
            if (res.msg === "token is null") {
                // 处理登录失效
                logger.error("登录失效，退出");
                const timer = setTimeout(() => {
                    clearTimeout(timer);
                    process.exit(0);
                }, 1000);
            }
        }
        return res;
    },
    (error) => {
        const { status, request } = error.response;
        const errorLog = {
            error: STATUS_CODE[status],
            responseURL: request.responseURL,
        };
        logger.error(`调用${getEnv()}${request.responseURL}失败 【${errorLog}】`);
        return data;
    }
);
export default server