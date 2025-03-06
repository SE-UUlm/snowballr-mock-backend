import pino from "pino";

const level = process.env.LOG_LEVEL ?? "debug";

export const LOG = pino({
    level: level,
    transport: {
        target: "pino-pretty",
    },
});
