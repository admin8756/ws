import log4js from "log4js";
log4js.configure({
    appenders: {
        app: {
            type: "dateFile",
            filename: "logs/app",
            maxLogSize: 10485760,
            numBackups: 3,
            pattern: "yyyy-MM-dd.log",
            alwaysIncludePattern: true,
        },
    },
    categories: {
        default: {
            appenders: ["app", "errors"],
            level: "DEBUG",
        },
        http: {
            appenders: ["access"],
            level: "DEBUG",
        },
    },
});
const logger = log4js.getLogger("app");

export { logger }