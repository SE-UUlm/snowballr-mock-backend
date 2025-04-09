import pino from "pino";

// Initializing the logging
//
// Environment variable cannot be moved to `options.ts` due to a cyclical
// dependency.
const level = process.env.LOG_LEVEL ?? "debug";
export const LOG = pino({
    level: level,
    transport: {
        target: "pino-pretty",
    },
});
