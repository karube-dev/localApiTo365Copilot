# syntax=docker/dockerfile:1
FROM node:22-slim

# Install OS dependencies required by Chromium / Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libexpat1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    libxtst6 \
    wget \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies (including Playwright browsers)
COPY package*.json ./
RUN npm ci
RUN npx playwright install chromium

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime environment
ENV NODE_ENV=production
ENV PORT=3000
ENV BROWSER_HEADLESS=true

# Persist the browser session via a named volume (mount at runtime)
VOLUME ["/app/.browser-session"]

EXPOSE 3000

CMD ["node", "dist/index.js"]
