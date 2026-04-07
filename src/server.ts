import express, { Application, Request, Response, NextFunction } from "express";
import healthRouter from "./routes/health.js";
import modelsRouter from "./routes/models.js";
import chatRouter from "./routes/chat.js";

export function createServer(): Application {
  const app = express();

  // Parse JSON bodies (up to 10 MB to accommodate large prompts).
  app.use(express.json({ limit: "10mb" }));

  // ------------------------------------------------------------------
  // Routes
  // ------------------------------------------------------------------
  app.use("/health", healthRouter);
  app.use("/v1/models", modelsRouter);
  app.use("/v1/chat/completions", chatRouter);

  // 404 handler
  app.use((_req: Request, res: Response): void => {
    res.status(404).json({ error: { message: "Not found", type: "not_found" } });
  });

  // Generic error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    console.error("[server] Unhandled error:", err);
    res.status(500).json({
      error: { message: err.message ?? "Internal server error", type: "server_error" },
    });
  });

  return app;
}
