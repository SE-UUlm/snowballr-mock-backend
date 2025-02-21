import pino from "pino";

const level = process.env.LOGLEVEL ?? "debug";

export const LOG = pino({
  level: level,
  transport: {
    target: "pino-pretty",
  },
});
