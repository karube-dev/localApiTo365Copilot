import "dotenv/config";
import { createServer } from "./server.js";
import { BrowserSessionManager } from "./browser/sessionManager.js";

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);

const app = createServer();

const httpServer = app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  console.log(`[server] Health   : GET  http://localhost:${PORT}/health`);
  console.log(`[server] Models   : GET  http://localhost:${PORT}/v1/models`);
  console.log(`[server] Chat     : POST http://localhost:${PORT}/v1/chat/completions`);
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[server] Received ${signal} – shutting down gracefully …`);
  httpServer.close(async () => {
    await BrowserSessionManager.getInstance().close();
    console.log("[server] Bye.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT",  () => { void shutdown("SIGINT"); });
