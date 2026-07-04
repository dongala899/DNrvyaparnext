---
name: Electron app running in Replit browser preview
description: How this Electron desktop app (DNR Vyapar Next) is made to run in Replit's headless browser preview instead of an actual Electron window.
---

Replit's preview pane is a browser iframe with no display server, so the real Electron shell (`electron/main.cjs`, native windows, `ipcMain`) cannot run here. Since the app's storage (`sql.js`, pure WASM) and auth (`bcryptjs`, pure JS) have no native binary dependencies, they run fine directly in plain Node.

**Approach:** `server/index.cjs` is a small plain-Node HTTP server that reuses the exact same adapters as Electron's main process (`electron/adapters/sqlite-adapter.cjs`, `migration-runner.cjs`, `pdf-adapter.cjs`) and re-exposes the same IPC channel names (`storage:query`, `auth:verifyPassword`, etc.) over a single `POST /api/ipc` endpoint (`{ channel, payload }` -> handler result), instead of `ipcMain.handle`.

On the frontend, `src/shared/browser-api.js` installs a `window.api` shim (mirrors `electron/preload.js`'s shape) only when `window.api` isn't already present (i.e., not actually inside Electron), so the exact same renderer code path works in both environments. Native-only features (file dialogs, window controls) resolve locally with a "not available in browser preview" stub rather than crashing.

**Why:** Preserves the existing module architecture (services call `window.api.*` uniformly) without forking renderer logic for web vs. desktop, and keeps the real Electron desktop build (`npm run start`/`package`) untouched.

**How to apply:** The dev workflow (`npm run dev` -> `scripts/dev.cjs`) spawns both `server/index.cjs` (port 3001, localhost) and `vite` (port 5000, 0.0.0.0, `allowedHosts: true`), with Vite proxying `/api` to the backend. If adding new Electron IPC channels, add the handler in both `electron/main.cjs` (for the real desktop app) and `server/index.cjs` (for the web bridge) to keep them in sync.
