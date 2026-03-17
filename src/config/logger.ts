const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: "info", message, ...meta }));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: "error", message, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: "warn", message, ...meta }));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (isDev) {
      console.debug(JSON.stringify({ level: "debug", message, ...meta }));
    }
  },
};
