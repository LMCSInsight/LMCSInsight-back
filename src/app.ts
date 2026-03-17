import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware.js";

const app = express();

app.use(rateLimitMiddleware);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

export default app;
