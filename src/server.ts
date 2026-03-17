import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(`Server listening on port ${env.PORT}`, { env: env.NODE_ENV });
});

process.on("SIGTERM", () => {
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
