import pino from "pino";

// File destination for all log levels (trace and above)
const fileTransport = pino.transport({
    target: "pino/file",
    options: {
        destination: "./mock-backend.log",
        mkdir: true,
        sync: false,
    },
});

// Console output for the specified log level and above logs
const consoleTransport = pino.transport({
    target: "pino-pretty",
    options: {
        minimumLevel: process.env.LOG_LEVEL ?? "debug",
    },
});

// Multi-destination logger that writes to both transports
export const logger = pino(
    {
        level: "trace", // Base level for the logger (will allow trace logs)
    },
    pino.multistream([
        // All logs (trace and above) go to file
        { stream: fileTransport, level: "trace" },
        // Only the specified log level and above go to console
        { stream: consoleTransport, level: process.env.LOG_LEVEL ?? "debug" },
    ]),
);
