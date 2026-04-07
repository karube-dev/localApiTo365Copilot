import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "../types/openai.js";
import { BrowserSessionManager } from "../browser/sessionManager.js";
import { defaultSelectors, defaultConfig } from "../adapters/copilot365.js";

const router = Router();

/**
 * Converts an array of OpenAI-style chat messages into a single prompt
 * string suitable for pasting into a chat input box.
 *
 * System messages are prepended as "[System]: …" blocks.
 * User and assistant turns are formatted as "[User]: …" / "[Assistant]: …".
 * The last user message is what actually gets sent, but we include the
 * history so the model has context (if the UI supports multi-turn via text).
 */
function messagesToPrompt(messages: ChatCompletionRequest["messages"]): string {
  return messages
    .map((m) => {
      const label =
        m.role === "system"
          ? "[System]"
          : m.role === "assistant"
          ? "[Assistant]"
          : "[User]";
      return `${label}: ${m.content}`;
    })
    .join("\n\n");
}

/**
 * POST /v1/chat/completions
 *
 * Accepts an OpenAI-style request body, drives a Playwright browser page
 * to send the prompt to Microsoft 365 Copilot Chat, waits for the reply,
 * and returns the response in OpenAI chat-completion format.
 *
 * stream=true is not yet supported and will return a 501.
 */
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const body = req.body as ChatCompletionRequest;

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: { message: "messages array is required", type: "invalid_request_error" } });
    return;
  }

  if (body.stream === true) {
    res.status(501).json({ error: { message: "stream=true is not yet supported", type: "not_implemented" } });
    return;
  }

  const prompt = messagesToPrompt(body.messages);
  const config = defaultConfig;
  const selectors = defaultSelectors;

  let assistantReply: string;
  try {
    const manager = BrowserSessionManager.getInstance();
    const page = await manager.getPage();

    // Navigate to the Copilot Chat page if not already there.
    if (!page.url().startsWith(config.chatUrl)) {
      await page.goto(config.chatUrl, { timeout: config.readyTimeoutMs, waitUntil: "domcontentloaded" });
    }

    // Wait for the prompt input to be available (page is interactive).
    await page.waitForSelector(selectors.promptInput, { timeout: config.readyTimeoutMs });

    // Clear any existing text and type the prompt.
    const inputEl = page.locator(selectors.promptInput).first();
    await inputEl.fill(prompt);

    // Submit the prompt.
    const submitBtn = page.locator(selectors.submitButton).first();
    await submitBtn.click();

    // If there is a loading indicator, wait for it to disappear first.
    if (selectors.loadingIndicator) {
      try {
        await page.waitForSelector(selectors.loadingIndicator, {
          state: "visible",
          timeout: 5000,
        });
        await page.waitForSelector(selectors.loadingIndicator, {
          state: "hidden",
          timeout: config.replyTimeoutMs,
        });
      } catch {
        // The loading indicator may not appear at all – continue.
      }
    }

    // Wait for at least one assistant message to appear.
    await page.waitForSelector(selectors.lastAssistantMessage, {
      timeout: config.replyTimeoutMs,
    });

    // Read the text of the last assistant message.
    const lastMsg = page.locator(selectors.lastAssistantMessage).last();
    assistantReply = (await lastMsg.innerText()).trim();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[chat] Browser automation error:", message);
    res.status(502).json({
      error: {
        message: `Browser automation failed: ${message}`,
        type: "browser_error",
      },
    });
    return;
  }

  const completionId = `chatcmpl-${uuidv4()}`;
  const model = body.model ?? "copilot-365";

  const response: ChatCompletionResponse = {
    id: completionId,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: assistantReply,
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      // NOTE: Exact token counts are not available from the browser UI.
      // These are rough estimates (≈4 characters per token) provided for
      // API compatibility only.  Do not rely on them for billing or rate-limit
      // calculations.
      prompt_tokens: Math.ceil(prompt.length / 4),
      completion_tokens: Math.ceil(assistantReply.length / 4),
      total_tokens: Math.ceil((prompt.length + assistantReply.length) / 4),
    },
  };

  res.json(response);
});

export default router;
