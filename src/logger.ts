import pino from "pino";

// Initializing the logging
//
// Environment variable cannot be moved to `options.ts` due to a cyclic
// dependency.
const level = process.env.LOG_LEVEL ?? "debug";
export const logger = pino({
    level: level,
    transport: {
        target: "pino-pretty",
    },
});
