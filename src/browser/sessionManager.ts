/**
 * Browser session manager.
 *
 * Maintains a single persistent Playwright browser context backed by a
 * user-data directory so that authentication cookies / local-storage
 * survive across server restarts.
 *
 * Usage:
 *   const manager = BrowserSessionManager.getInstance();
 *   const page    = await manager.getPage();
 */

import { BrowserContext, Page, chromium } from "playwright";
import path from "path";

const USER_DATA_DIR = process.env["BROWSER_USER_DATA_DIR"]
  ? path.resolve(process.env["BROWSER_USER_DATA_DIR"])
  : path.resolve(process.cwd(), ".browser-session");

const HEADLESS = process.env["BROWSER_HEADLESS"] !== "false";

export class BrowserSessionManager {
  private static instance: BrowserSessionManager;

  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private constructor() {}

  static getInstance(): BrowserSessionManager {
    if (!BrowserSessionManager.instance) {
      BrowserSessionManager.instance = new BrowserSessionManager();
    }
    return BrowserSessionManager.instance;
  }

  /**
   * Returns the shared Page, launching a new browser / context if needed.
   */
  async getPage(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    await this.launch();
    return this.page!;
  }

  /**
   * Launches the browser with a persistent context.
   */
  private async launch(): Promise<void> {
    console.log(`[browser] Launching browser (headless=${HEADLESS}, userDataDir=${USER_DATA_DIR})`);

    this.context = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: HEADLESS,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

    this.context.on("close", () => {
      console.log("[browser] Context closed");
      this.context = null;
      this.page = null;
    });

    this.page.on("close", () => {
      console.log("[browser] Page closed – will reopen on next request");
      this.page = null;
    });
  }

  /**
   * Gracefully closes the browser and its context.
   */
  async close(): Promise<void> {
    try {
      if (this.context) {
        await this.context.close();
      }
    } finally {
      this.context = null;
      this.page = null;
    }
  }
}
