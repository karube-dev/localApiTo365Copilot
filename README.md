# localApiTo365Copilot

A local Node.js / TypeScript proof-of-concept that exposes an **OpenAI-compatible REST API** and uses [Playwright](https://playwright.dev/) to forward prompts to **Microsoft 365 Copilot Chat** in a real browser, then returns the replies in OpenAI format.

This lets tools like [Cline](https://github.com/clinebot/cline), [Continue](https://github.com/continuedev/continue), or any OpenAI-compatible client talk to M365 Copilot Chat without needing an actual OpenAI key.

---

## Features

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Liveness check |
| `/v1/models` | GET | Lists the `copilot-365` model |
| `/v1/chat/completions` | POST | Sends the prompt to M365 Copilot Chat and returns the reply |

- Persisted browser session (authentication survives restarts).
- Browser selectors are isolated in `src/adapters/copilot365.ts` with TODO placeholders – easy to swap in real selectors once the live DOM is inspected.
- Robust timeout handling with configurable `READY_TIMEOUT_MS` and `REPLY_TIMEOUT_MS`.
- `stream=false` only for now; streaming support is scaffolded for future work.

---

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [npm 9+](https://npmjs.com/)
- A Microsoft 365 account with Copilot Chat access.

---

## Quick start

### 1 – Clone and install

```bash
git clone https://github.com/karube-dev/localApiTo365Copilot.git
cd localApiTo365Copilot
npm install
npx playwright install chromium
```

### 2 – Configure

```bash
cp .env.example .env
# Edit .env if you need to change any defaults
```

### 3 – Authenticate (one-time, headed mode)

The first time you run the server you must log in to M365 manually.  
Run the server in **headed** (visible browser) mode so you can sign in:

```bash
BROWSER_HEADLESS=false npm run dev
```

The browser will open.  Navigate to `https://m365.cloud.microsoft/chat`, sign in with your Microsoft 365 account, and complete MFA.  The session (cookies & local storage) is saved to `.browser-session/`.  Press `Ctrl+C` to stop the server.

> ⚠️ **Important**: The default browser selectors in `src/adapters/copilot365.ts` are TODO stubs.  Before the proxy can interact with the page you must inspect the live Copilot Chat DOM and replace each `TODO` selector with the real one.  See the [Selectors](#updating-the-browser-selectors) section below.

### 4 – Start the server

```bash
# Development (ts-node, no build step)
npm run dev

# Production
npm run build
npm start
```

### 5 – Test it

```bash
# Health
curl http://localhost:3000/health

# Models
curl http://localhost:3000/v1/models

# Chat completion
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "copilot-365",
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }'
```

---

## Docker

```bash
# Build
docker build -t localapito365copilot .

# Run (mount a local directory for the browser session so auth persists)
docker run -p 3000:3000 \
  -v "$(pwd)/.browser-session:/app/.browser-session" \
  --env-file .env \
  localapito365copilot
```

> Headed mode is not available inside Docker without an X display.  Authenticate on a local machine first and then copy the `.browser-session` directory into the container volume.

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `COPILOT_CHAT_URL` | `https://m365.cloud.microsoft/chat` | URL of the Copilot Chat page |
| `READY_TIMEOUT_MS` | `30000` | ms to wait for the page to be interactive |
| `REPLY_TIMEOUT_MS` | `120000` | ms to wait for the assistant reply |
| `BROWSER_USER_DATA_DIR` | `.browser-session` | Directory for the persistent browser session |
| `BROWSER_HEADLESS` | `true` | Set to `false` for a visible browser window |

---

## Updating the browser selectors

Open `src/adapters/copilot365.ts` and replace the four `TODO` selectors in `defaultSelectors` with the real ones from the live M365 Copilot Chat page.

```
promptInput          – the <textarea> (or contenteditable) where you type
submitButton         – the Send button
lastAssistantMessage – the container for the most-recent AI reply
loadingIndicator     – the "Stop generating" button (set to "" to disable)
```

Use the browser DevTools (F12 → Inspector / Elements panel) on the M365 Copilot Chat page to find stable `data-*` attributes, `aria-label` values, or unique class names.

---

## Project structure

```
src/
  index.ts                  Entry point – starts Express, handles shutdown
  server.ts                 Express app factory
  routes/
    health.ts               GET /health
    models.ts               GET /v1/models
    chat.ts                 POST /v1/chat/completions
  adapters/
    copilot365.ts           Browser selectors & config (TODO placeholders)
  browser/
    sessionManager.ts       Persistent Playwright browser/context/page
  types/
    openai.ts               OpenAI-compatible TypeScript types
.env.example                Example environment configuration
Dockerfile                  Container image definition
tsconfig.json               TypeScript compiler configuration
```

---

## Roadmap

- [ ] Replace TODO selectors with real M365 Copilot Chat selectors
- [ ] Add streaming support (`stream=true`)
- [ ] Maintain conversation state across turns
- [ ] Add authentication health-check endpoint
- [ ] Publish a Docker image
