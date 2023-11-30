import log4js from "log4js";

log4js.configure({
    appenders: {
        app: {
            type: "dateFile",
            filename: "logs/app",
            maxLogSize: 10485760,
            backups: 3,
            pattern: "yyyy-MM-dd.log",
            alwaysIncludePattern: true,
        },
        console: {
            type: "console",
        },
        access: {
            type: "file",
            filename: "logs/access.log",
            maxLogSize: 10485760,
            backups: 3,
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

export { logger };