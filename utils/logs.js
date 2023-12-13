import log4js from "log4js";

log4js.configure({
    appenders: {
        app: {
            type: "dateFile",
            filename: "logs/app",
            maxLogSize: 10485760,
            backups: 5,
            pattern: "yyyy-MM-dd.log",
            alwaysIncludePattern: true,
            layout: {
                type: "pattern",
                pattern: "[%d{yyyy-MM-dd hh:mm:ss}] [%p] %m",
            },
        },
        console: {
            type: "console",
        },
        access: {
            type: "file",
            filename: "logs/access.log",
            maxLogSize: 10485760,
            backups: 3,
            layout: {
                type: "pattern",
                pattern: "[%d{yyyy-MM-dd hh:mm:ss}] [%p] %m",
            },
        },
    },
    categories: {
        default: {
            appenders: ["app", "console"],
            level: "debug",
        },
        http: {
            appenders: ["access"],
            level: "debug",
        },
    },
});

const logger = log4js.getLogger("app");
const httpLogger = log4js.getLogger("http");

export { logger, httpLogger };