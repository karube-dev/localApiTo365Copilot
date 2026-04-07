/**
 * Microsoft 365 Copilot Chat – browser selectors adapter.
 *
 * All selectors are TODO placeholders that must be updated once the
 * exact DOM structure of the target page is known.  The interface is
 * intentionally kept narrow so that swapping in real selectors later
 * requires changes only in this file.
 */

export interface CopilotAdapterConfig {
  /** URL of the Microsoft 365 Copilot Chat page. */
  chatUrl: string;
  /** Milliseconds to wait for the chat UI to become interactive. */
  readyTimeoutMs: number;
  /** Milliseconds to wait for the assistant reply to appear. */
  replyTimeoutMs: number;
}

export interface CopilotSelectors {
  /**
   * Selector for the text-input element where the prompt is typed.
   * TODO: Replace with the real selector once the M365 Copilot Chat DOM
   *       structure has been inspected.
   *       Example: 'textarea[data-testid="copilot-input"]'
   */
  promptInput: string;

  /**
   * Selector for the button that submits the prompt.
   * TODO: Replace with the real selector.
   *       Example: 'button[aria-label="Send"]'
   */
  submitButton: string;

  /**
   * Selector for the container that holds the most-recent assistant reply.
   * The adapter will wait for this element to appear / stop changing before
   * reading its innerText.
   * TODO: Replace with the real selector.
   *       Example: '[data-testid="assistant-message"]:last-of-type'
   */
  lastAssistantMessage: string;

  /**
   * Optional selector for a "Stop generating" / loading indicator.
   * When present the adapter will wait for it to disappear before reading
   * the reply, giving the model time to finish streaming.
   * TODO: Replace with the real selector, or leave as empty string to skip.
   *       Example: '[aria-label="Stop generating"]'
   */
  loadingIndicator: string;
}

/**
 * Default selectors for Microsoft 365 Copilot Chat.
 *
 * All values are currently TODO stubs.  Inspect the live page and replace
 * each selector with one that uniquely identifies the target element.
 */
export const defaultSelectors: CopilotSelectors = {
  // TODO: Replace with the real prompt-input selector.
  promptInput: "textarea",

  // TODO: Replace with the real submit-button selector.
  submitButton: 'button[type="submit"]',

  // TODO: Replace with the real last-assistant-message selector.
  lastAssistantMessage: '[data-role="assistant"]:last-of-type',

  // TODO: Replace with the real loading-indicator selector, or set to ""
  //       to disable the wait-for-idle logic.
  loadingIndicator: '[aria-label="Stop generating"]',
};

export const defaultConfig: CopilotAdapterConfig = {
  chatUrl: process.env["COPILOT_CHAT_URL"] ?? "https://m365.cloud.microsoft/chat",
  readyTimeoutMs: parseInt(process.env["READY_TIMEOUT_MS"] ?? "30000", 10),
  replyTimeoutMs: parseInt(process.env["REPLY_TIMEOUT_MS"] ?? "120000", 10),
};
