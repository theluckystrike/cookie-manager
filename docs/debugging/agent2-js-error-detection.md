# Zovo Cookie Manager: JavaScript Error Prevention & Detection Guide

**Agent:** JS Error Detection Specialist (Agent 2)
**Date:** 2026-02-11
**Status:** Implementation-Ready
**Scope:** ESLint config, Chrome API validation, async error handling, service worker safety, TypeScript type safety, bug prevention checklist, debug utility module

---

## 1. ESLint Configuration

Complete `.eslintrc.json` for Chrome extension + TypeScript + Preact. This configuration enforces security rules (no eval, no innerHTML), import ordering, strict null safety, and Chrome API best practices.

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": { "jsx": true },
    "project": "./tsconfig.json",
    "jsxPragma": "h",
    "jsxFragmentName": "Fragment"
  },
  "env": {
    "browser": true,
    "es2022": true,
    "webextensions": true
  },
  "plugins": [
    "@typescript-eslint",
    "import",
    "security"
  ],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/typescript"
  ],
  "settings": {
    "import/resolver": { "typescript": {} }
  },
  "rules": {
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-restricted-properties": ["error",
      { "object": "document", "property": "write", "message": "document.write is forbidden in extensions." },
      { "object": "window", "property": "localStorage", "message": "Use chrome.storage instead of localStorage in extensions." },
      { "object": "window", "property": "sessionStorage", "message": "Use chrome.storage instead of sessionStorage in extensions." }
    ],
    "no-restricted-globals": ["error",
      { "name": "localStorage", "message": "Use chrome.storage.local instead." },
      { "name": "sessionStorage", "message": "Use chrome.storage.local instead." }
    ],
    "no-restricted-syntax": ["error",
      {
        "selector": "AssignmentExpression[left.property.name='innerHTML']",
        "message": "innerHTML is forbidden. Use textContent or Preact JSX interpolation."
      },
      {
        "selector": "AssignmentExpression[left.property.name='outerHTML']",
        "message": "outerHTML is forbidden. Use Preact components for DOM updates."
      },
      {
        "selector": "CallExpression[callee.property.name='insertAdjacentHTML']",
        "message": "insertAdjacentHTML is forbidden. Use Preact rendering."
      },
      {
        "selector": "JSXAttribute[name.name='dangerouslySetInnerHTML']",
        "message": "dangerouslySetInnerHTML is forbidden. Render content through JSX."
      }
    ],
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "@typescript-eslint/strict-boolean-expressions": ["error", {
      "allowString": false,
      "allowNumber": false,
      "allowNullableObject": true
    }],
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "pathGroups": [
        { "pattern": "preact/**", "group": "external", "position": "before" },
        { "pattern": "@zovo/**", "group": "internal", "position": "before" },
        { "pattern": "../shared/**", "group": "internal" },
        { "pattern": "../types/**", "group": "internal" }
      ],
      "newlines-between": "always",
      "alphabetize": { "order": "asc" }
    }],
    "import/no-duplicates": "error",
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn"
  },
  "overrides": [
    {
      "files": ["src/background/**/*.ts"],
      "rules": {
        "no-restricted-globals": ["error",
          { "name": "document", "message": "Service workers have no DOM access." },
          { "name": "window", "message": "Service workers have no window object. Use globalThis." },
          { "name": "localStorage", "message": "Use chrome.storage in service workers." }
        ]
      }
    },
    {
      "files": ["tests/**/*.ts"],
      "rules": {
        "no-console": "off",
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

Key points: the `overrides` block for `src/background/**` bans `document` and `window` access entirely, catching the most common service worker mistake at lint time. The `no-restricted-syntax` rules block every DOM injection vector (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `dangerouslySetInnerHTML`). The `@typescript-eslint/no-floating-promises` rule catches every unawaited Chrome API call.

---

## 2. Chrome API Usage Validation Patterns

### 2.1 chrome.cookies

```typescript
// ---- CORRECT: getAll with proper error handling ----
async function getCookiesForDomain(domain: string): Promise<chrome.cookies.Cookie[]> {
  try {
    const cookies = await chrome.cookies.getAll({ domain });
    return cookies;
  } catch (err: unknown) {
    debug.error("cookies.getAll failed", { domain, err });
    return [];
  }
}

// ---- CORRECT: getAll scoped to active tab URL ----
async function getCookiesForActiveTab(): Promise<chrome.cookies.Cookie[]> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url == null || tab.url.startsWith("chrome://")) {
    return []; // No cookie access on internal pages
  }
  return chrome.cookies.getAll({ url: tab.url });
}

// ---- WRONG: passing protocol in domain ----
// chrome.cookies.getAll({ domain: "https://example.com" })
// The domain parameter must NOT include the protocol.
// Correct: { domain: ".example.com" } or { url: "https://example.com" }

// ---- CORRECT: set with full validation ----
async function setCookie(
  details: chrome.cookies.SetDetails
): Promise<chrome.cookies.Cookie | null> {
  // Validate domain has no protocol
  if (details.domain?.includes("://")) {
    throw new Error("Domain must not include protocol prefix");
  }
  // Enforce SameSite=None requires Secure
  if (details.sameSite === "no_restriction" && details.secure !== true) {
    details.secure = true;
  }
  try {
    const cookie = await chrome.cookies.set(details);
    return cookie;
  } catch (err: unknown) {
    // chrome.cookies.set does NOT throw on failure in all browsers.
    // Check chrome.runtime.lastError for older patterns.
    debug.error("cookies.set failed", { details, err });
    return null;
  }
}

// ---- CORRECT: remove requires url + name, not domain ----
async function removeCookie(
  url: string,
  name: string,
  storeId?: string
): Promise<boolean> {
  try {
    const details: chrome.cookies.Details = { url, name };
    if (storeId != null) {
      (details as chrome.cookies.RemoveDetails & { storeId: string }).storeId = storeId;
    }
    await chrome.cookies.remove(details);
    return true;
  } catch {
    return false;
  }
}

// ---- WRONG: remove with domain instead of url ----
// chrome.cookies.remove({ domain: ".example.com", name: "session" })
// remove() requires a full URL, not a domain.

// ---- CORRECT: onChanged with type narrowing ----
chrome.cookies.onChanged.addListener((changeInfo) => {
  const { removed, cookie, cause } = changeInfo;
  // cause: "evicted" | "expired" | "explicit" | "expired_overwrite" | "overwrite"
  if (cause === "explicit" && removed) {
    // User or extension deleted this cookie
    invalidateCache(cookie.domain);
  }
  if (cause === "overwrite" && !removed) {
    // Cookie was updated (set with new value)
    invalidateCache(cookie.domain);
  }
});

// ---- EDGE CASE: incognito cookie store ----
async function getCookiesForStore(
  domain: string,
  storeId: string
): Promise<chrome.cookies.Cookie[]> {
  try {
    return await chrome.cookies.getAll({ domain, storeId });
  } catch {
    // storeId may not exist if incognito window was closed
    return [];
  }
}
```

### 2.2 chrome.storage

```typescript
// ---- CORRECT: Type-safe storage wrapper ----
// src/shared/storage.ts

import type { LocalStorage, SyncStorage } from "../types/storage";

type LocalKey = keyof LocalStorage;
type SyncKey = keyof SyncStorage;

export async function getLocal<K extends LocalKey>(
  key: K
): Promise<LocalStorage[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key] as LocalStorage[K] | undefined;
}

export async function setLocal<K extends LocalKey>(
  key: K,
  value: LocalStorage[K]
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getSync<K extends SyncKey>(
  key: K
): Promise<SyncStorage[K] | undefined> {
  const result = await chrome.storage.sync.get(key);
  return result[key] as SyncStorage[K] | undefined;
}

export async function setSync<K extends SyncKey>(
  key: K,
  value: SyncStorage[K]
): Promise<void> {
  await chrome.storage.sync.set({ [key]: value });
}

// ---- CORRECT: Batch read to reduce IPC calls ----
export async function getLocalBatch<K extends LocalKey>(
  keys: K[]
): Promise<Pick<LocalStorage, K>> {
  return (await chrome.storage.local.get(keys)) as Pick<LocalStorage, K>;
}

// ---- CORRECT: Quota-safe write with fallback ----
export async function safeSetLocal<K extends LocalKey>(
  key: K,
  value: LocalStorage[K]
): Promise<boolean> {
  try {
    await chrome.storage.local.set({ [key]: value });
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("QUOTA_BYTES")) {
      debug.warn("Storage quota exceeded, attempting cleanup", { key });
      await pruneStaleCache();
      try {
        await chrome.storage.local.set({ [key]: value });
        return true;
      } catch {
        debug.error("Storage write failed even after cleanup", { key });
        return false;
      }
    }
    throw err;
  }
}

// ---- WRONG: reading without null check ----
// const { profiles } = await chrome.storage.local.get("profiles");
// profiles.length  <-- TypeError if profiles is undefined
// Always destructure with a default or null-check first.

// ---- CORRECT: safe destructure ----
const { profiles = [] } = await chrome.storage.local.get("profiles");
```

### 2.3 chrome.tabs

```typescript
// ---- CORRECT: Active tab query with existence check ----
async function getActiveTabUrl(): Promise<string | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (tab?.url == null) return null;
  // Reject non-HTTP(S) URLs
  if (!tab.url.startsWith("http://") && !tab.url.startsWith("https://")) {
    return null;
  }
  return tab.url;
}

// ---- WRONG: accessing tab.url without checking for undefined ----
// const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
// new URL(tab.url)  <-- tab may be undefined; tab.url may be undefined

// ---- CORRECT: Tab existence check before operations ----
async function isTabAlive(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.get(tabId);
    return true;
  } catch {
    return false;  // Tab was closed
  }
}

// ---- CORRECT: Handling tab close for auto-delete rules ----
// Cache tab URLs because onRemoved does NOT provide the URL
const tabUrlCache = new Map<number, string>();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url != null) {
    tabUrlCache.set(tabId, changeInfo.url);
  } else if (tab.url != null) {
    tabUrlCache.set(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  const url = tabUrlCache.get(tabId);
  tabUrlCache.delete(tabId);
  if (url != null) {
    void executeTabCloseRules(url);
  }
});
```

### 2.4 chrome.alarms

```typescript
// ---- CORRECT: Alarm creation with minimum interval guard ----
async function createAlarm(
  name: string,
  intervalMinutes: number
): Promise<void> {
  // Chrome enforces minimum 1 minute in production (0.5 in dev with flag)
  const safeInterval = Math.max(intervalMinutes, 1);
  await chrome.alarms.create(name, {
    periodInMinutes: safeInterval,
    delayInMinutes: safeInterval,
  });
}

// ---- CORRECT: Alarm handler with name-based dispatch ----
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "license-check":
      void handleLicenseCheck();
      break;
    case "analytics-flush":
      void handleAnalyticsFlush();
      break;
    case "sync-poll":
      void handleSyncPoll();
      break;
    default:
      if (alarm.name.startsWith("rule-timer-")) {
        const ruleId = alarm.name.slice("rule-timer-".length);
        void executeTimerRule(ruleId);
      } else {
        debug.warn("Unknown alarm fired", { name: alarm.name });
      }
  }
});

// ---- CORRECT: Re-register alarms on startup (they can be lost) ----
chrome.runtime.onStartup.addListener(async () => {
  const existingAlarms = await chrome.alarms.getAll();
  const existingNames = new Set(existingAlarms.map((a) => a.name));

  const requiredAlarms = [
    { name: "license-check", intervalMinutes: 1440 },      // 24 hours
    { name: "analytics-flush", intervalMinutes: 5 },
    { name: "sync-poll", intervalMinutes: 15 },
    { name: "usage-reset-monthly", intervalMinutes: 1440 },
  ];

  for (const alarm of requiredAlarms) {
    if (!existingNames.has(alarm.name)) {
      await createAlarm(alarm.name, alarm.intervalMinutes);
    }
  }
});
```

### 2.5 chrome.runtime (Message Passing)

```typescript
// ---- CORRECT: Message with typed response and proper async handling ----
interface MessageMap {
  GET_COOKIES: { domain: string };
  SET_COOKIE: chrome.cookies.SetDetails;
  GET_TIER: undefined;
  TIER_CHANGED: { tier: string };
  LOAD_PROFILE: { profileId: string };
}

interface ResponseMap {
  GET_COOKIES: chrome.cookies.Cookie[];
  SET_COOKIE: chrome.cookies.Cookie | null;
  GET_TIER: string;
  TIER_CHANGED: void;
  LOAD_PROFILE: { success: boolean; count: number };
}

type MessageType = keyof MessageMap;

async function sendTypedMessage<T extends MessageType>(
  type: T,
  payload: MessageMap[T]
): Promise<ResponseMap[T]> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError != null) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response as ResponseMap[T]);
    });
  });
}

// ---- CORRECT: Listener returning true for async response ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (typeof message?.type !== "string") return;

  handleMessage(message)
    .then(sendResponse)
    .catch((err: unknown) => {
      debug.error("Message handler failed", { type: message.type, err });
      sendResponse({ error: "internal_error" });
    });

  return true; // CRITICAL: signals async response
});

// ---- WRONG: forgetting to return true ----
// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   fetchData().then(sendResponse);
//   // Missing `return true` -- Chrome closes the message channel immediately
// });

// ---- CORRECT: onInstalled with reason check ----
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await initializeDefaults();
    await registerAllAlarms();
  } else if (details.reason === "update") {
    await runStorageMigrations(details.previousVersion ?? "0.0.0");
    await ensureAlarmsRegistered();
  }
});
```

### 2.6 chrome.identity

```typescript
// ---- CORRECT: launchWebAuthFlow with full error handling ----
async function startGoogleOAuth(): Promise<{ token: string; tier: string } | null> {
  const redirectUri = chrome.identity.getRedirectURL();
  const codeVerifier = generatePKCEVerifier();
  const codeChallenge = await computePKCEChallenge(codeVerifier);
  const state = crypto.randomUUID();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "email profile");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);

  let responseUrl: string;
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl.toString(),
      interactive: true,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("user closed")) {
        // User cancelled the auth flow -- not an error
        return null;
      }
      if (err.message.includes("network")) {
        debug.warn("OAuth failed due to network error");
        return null;
      }
    }
    debug.error("OAuth flow failed", { err });
    return null;
  }

  const params = new URL(responseUrl).searchParams;
  if (params.get("state") !== state) {
    debug.error("OAuth state mismatch -- possible CSRF");
    return null;
  }

  const code = params.get("code");
  if (code == null) {
    debug.error("OAuth response missing authorization code");
    return null;
  }

  // Exchange code for Zovo JWT via backend
  return exchangeCodeForToken(code, codeVerifier);
}

// ---- CORRECT: Token refresh with offline fallback ----
async function refreshTokenIfNeeded(): Promise<boolean> {
  const auth = await getSync("zovo_auth");
  if (auth?.token == null) return false;

  const expiresAt = new Date(auth.expires).getTime();
  const oneHourFromNow = Date.now() + 60 * 60 * 1000;

  if (expiresAt > oneHourFromNow) return true; // Still valid

  try {
    const response = await fetchWithTimeout(
      "https://api.zovo.app/v1/auth/refresh",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: auth.refresh_token }),
      },
      10_000
    );
    if (!response.ok) return false;
    const { token, expires } = (await response.json()) as {
      token: string;
      expires: string;
    };
    await setSync("zovo_auth", { ...auth, token, expires });
    return true;
  } catch {
    // Network unavailable -- check offline grace period
    const cache = await getLocal("license_cache");
    if (cache != null) {
      const graceExpiry = new Date(cache.expires_at).getTime();
      return Date.now() < graceExpiry;
    }
    return false;
  }
}
```

---

## 3. Async/Await Error Handling Patterns

### 3.1 Chrome API Try/Catch Wrapper

```typescript
type ChromeApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function chromeApi<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<ChromeApiResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    debug.error(`Chrome API error: ${operation}`, { error: message });
    return { ok: false, error: message };
  }
}

// Usage:
const result = await chromeApi("getAll cookies", () =>
  chrome.cookies.getAll({ domain: ".example.com" })
);
if (result.ok) {
  renderCookies(result.data);
} else {
  showError(`Could not load cookies: ${result.error}`);
}
```

### 3.2 Timeout Wrapper for Network Calls

```typescript
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
```

### 3.3 Retry with Exponential Backoff

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 60_000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      if (attempt === maxRetries) throw err;
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        maxDelayMs
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  // TypeScript requires this -- unreachable in practice
  throw new Error("Retry exhausted");
}

// Usage with API call:
const data = await withRetry(
  () => fetchWithTimeout("https://api.zovo.app/v1/auth/verify", {
    headers: { Authorization: `Bearer ${token}` },
  }, 10_000),
  { maxRetries: 3, baseDelayMs: 1000 }
);
```

### 3.4 Preact Error Boundary

```typescript
import { Component, type ComponentChildren } from "preact";

interface ErrorBoundaryProps {
  fallback: ComponentChildren;
  children: ComponentChildren;
  onError?: (error: Error, info: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    debug.error("Preact component error", {
      message: error.message,
      stack: error.stack ?? "no stack",
      componentStack: errorInfo.componentStack,
    });
    this.props.onError?.(error, errorInfo.componentStack);
  }

  render(): ComponentChildren {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Usage in App.tsx:
// <ErrorBoundary fallback={<CrashFallback />}>
//   <CookieList cookies={cookies} />
// </ErrorBoundary>
```

### 3.5 Unhandled Promise Rejection Catcher

```typescript
// In popup/index.tsx and options/index.tsx entry points
globalThis.addEventListener("unhandledrejection", (event) => {
  debug.error("Unhandled promise rejection", {
    reason: event.reason instanceof Error
      ? event.reason.message
      : String(event.reason),
  });
  event.preventDefault(); // Prevent default console error
});
```

---

## 4. Service Worker-Specific Issues

### 4.1 Restrictions and Correct Patterns

| Restriction | Wrong Pattern | Correct Pattern |
|---|---|---|
| No DOM access | `document.createElement("div")` | Use `chrome.offscreen` for DOM-dependent tasks |
| No `window` global | `window.setTimeout(...)` | `globalThis.setTimeout(...)` or `setTimeout(...)` |
| No `localStorage` | `localStorage.setItem("key", val)` | `chrome.storage.local.set({ key: val })` |
| No `setInterval` for persistence | `setInterval(fn, 300000)` | `chrome.alarms.create("name", { periodInMinutes: 5 })` |
| Terminates after ~30s idle | Storing state in global variables | Persist all state to `chrome.storage.local` |
| No `XMLHttpRequest` in MV3 | `new XMLHttpRequest()` | `fetch()` with `AbortController` |

### 4.2 State Persistence Before Idle

```typescript
// Pattern: Save state to storage on every mutation.
// Never rely on in-memory state surviving across wake cycles.

let tabUrlCache: Map<number, string> | null = null;

async function getTabUrlCache(): Promise<Map<number, string>> {
  if (tabUrlCache != null) return tabUrlCache;
  const stored = await getLocal("tab_url_cache");
  tabUrlCache = new Map(Object.entries(stored ?? {}));
  return tabUrlCache;
}

async function setTabUrl(tabId: number, url: string): Promise<void> {
  const cache = await getTabUrlCache();
  cache.set(tabId, url);
  // Persist to storage so it survives termination
  await setLocal(
    "tab_url_cache",
    Object.fromEntries(cache) as Record<string, string>
  );
}
```

### 4.3 Alarm Persistence Verification

```typescript
// Alarms survive browser restarts but can be lost on extension updates
// or Chrome crashes. Always verify on onStartup and onInstalled.

async function ensureAlarmsRegistered(): Promise<void> {
  const all = await chrome.alarms.getAll();
  const names = new Set(all.map((a) => a.name));

  const required: Array<{ name: string; periodInMinutes: number }> = [
    { name: "license-check", periodInMinutes: 1440 },
    { name: "analytics-flush", periodInMinutes: 5 },
    { name: "sync-poll", periodInMinutes: 15 },
    { name: "usage-reset-monthly", periodInMinutes: 1440 },
  ];

  for (const alarm of required) {
    if (!names.has(alarm.name)) {
      debug.warn(`Re-registering missing alarm: ${alarm.name}`);
      await chrome.alarms.create(alarm.name, {
        periodInMinutes: alarm.periodInMinutes,
        delayInMinutes: 1,
      });
    }
  }
}
```

---

## 5. TypeScript Type Safety

### 5.1 Core Type Definitions

```typescript
// src/types/cookie.d.ts

/** Re-export Chrome's cookie type with our extensions */
export type ChromeCookie = chrome.cookies.Cookie;

export interface CookieProfile {
  id: string;
  name: string;
  domain: string;
  cookies: ChromeCookie[];
  url_pattern?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
}

export interface AutoDeleteRule {
  id: string;
  name: string;
  pattern: string;
  trigger: "tab_close" | "timer" | "browser_start" | "manual";
  interval_minutes?: number;
  exceptions: string[];
  delete_first_party: boolean;
  delete_third_party: boolean;
  enabled: boolean;
  created_at: string;
  last_executed_at?: string;
}
```

```typescript
// src/types/messages.d.ts

/** Discriminated union for all message types */
export type ExtensionMessage =
  | { type: "GET_COOKIES"; payload: { domain: string } }
  | { type: "SET_COOKIE"; payload: chrome.cookies.SetDetails }
  | { type: "DELETE_COOKIE"; payload: { url: string; name: string } }
  | { type: "LOAD_PROFILE"; payload: { profileId: string } }
  | { type: "SAVE_PROFILE"; payload: { name: string; domain: string } }
  | { type: "GET_TIER"; payload?: undefined }
  | { type: "TIER_CHANGED"; payload: { tier: TierName } }
  | { type: "EXECUTE_RULE"; payload: { ruleId: string } };

export type TierName = "free" | "starter" | "pro" | "team";
```

```typescript
// src/types/storage.d.ts

export interface LocalStorage {
  cookies_cache: Record<string, {
    cookies: chrome.cookies.Cookie[];
    fetched_at: string;
  }>;
  profiles: CookieProfile[];
  rules: AutoDeleteRule[];
  snapshots: CookieSnapshot[];
  health_cache: Record<string, {
    score: string;
    issues: HealthIssue[];
    scanned_at: string;
  }>;
  usage: UsageCounters;
  analytics_queue: AnalyticsEvent[];
  license_cache: LicenseCache | null;
  onboarding: OnboardingState;
  tab_url_cache: Record<string, string>;
  operation_in_progress: boolean;
}

export interface SyncStorage {
  settings: UserSettings;
  zovo_auth: ZovoAuth | null;
  domain_lists: { whitelist: string[]; blacklist: string[] };
}
```

### 5.2 TIER_LIMITS Type

```typescript
// src/shared/constants.ts

export const TIER_LIMITS = {
  free: {
    profiles: 2,
    rules: 1,
    exportLimit: 25,
    whitelistDomains: 5,
    blacklistDomains: 5,
    protectedCookies: 5,
    gdprScans: 1,
    snapshots: 0,
    blockRules: 3,
    bulkOps: false,
    sync: false,
    monitoring: false,
    vault: false,
    regexSearch: false,
    teamSharing: false,
    sidePanel: false,
    devtoolsEditing: false,
    nonJsonExport: false,
    crossDomainExport: false,
    autoLoadProfiles: false,
  },
  // starter, pro, team omitted for brevity -- same shape
} as const;

export type TierName = keyof typeof TIER_LIMITS;
export type Feature = keyof typeof TIER_LIMITS.free;
export type FeatureLimit = number | boolean;
```

---

## 6. Common Bug Prevention Checklist

| # | Category | Common Bug | Prevention Pattern | ESLint Rule |
|---|----------|-----------|-------------------|-------------|
| 1 | Security | `eval()` or `new Function()` in codebase | Never use dynamic code evaluation | `no-eval`, `no-new-func` |
| 2 | Security | `innerHTML` with cookie values causes XSS | Use `textContent` or JSX interpolation exclusively | `no-restricted-syntax` (custom) |
| 3 | Security | `dangerouslySetInnerHTML` in Preact | Ban via ESLint; no exceptions | `no-restricted-syntax` (custom) |
| 4 | Async | Unawaited Chrome API promise silently fails | Always await or void-annotate | `@typescript-eslint/no-floating-promises` |
| 5 | Async | `sendMessage` callback closes before async response | Return `true` from `onMessage` listener | Code review; typed wrapper |
| 6 | Service Worker | Accessing `document` in background script | ESLint override bans `document` in `src/background/` | `no-restricted-globals` (override) |
| 7 | Service Worker | Using `localStorage` instead of `chrome.storage` | ESLint bans `localStorage` globally | `no-restricted-globals` |
| 8 | Service Worker | Global variable lost on termination | Persist all mutable state to `chrome.storage.local` | Code review pattern |
| 9 | Service Worker | `setInterval` stops when worker terminates | Use `chrome.alarms` for all recurring tasks | `no-restricted-globals` for `setInterval` |
| 10 | Tabs | `tab.url` is `undefined` on restricted pages | Null-check before use; guard `chrome://` and `file://` URLs | `@typescript-eslint/strict-boolean-expressions` |
| 11 | Tabs | `onRemoved` does not provide the closed tab's URL | Cache tab URLs via `onUpdated`; look up from cache in `onRemoved` | Documented pattern |
| 12 | Cookies | Domain includes protocol (`https://example.com`) | Validate domain has no `://` before passing to Chrome API | Runtime validation in `setCookie()` |
| 13 | Cookies | `SameSite=None` without `Secure` flag | Auto-set `secure: true` when `sameSite === "no_restriction"` | Runtime validation |
| 14 | Cookies | `remove()` called with domain instead of URL | `remove()` requires `{ url, name }`, not `{ domain, name }` | Typed wrapper function |
| 15 | Storage | Reading key that does not exist returns `undefined` | Destructure with defaults: `const { profiles = [] } = ...` | `@typescript-eslint/strict-boolean-expressions` |
| 16 | Storage | `chrome.storage.sync` 8KB per-item limit exceeded | Monitor item size; split large objects across keys or fall back to local | Runtime size check |
| 17 | Storage | Quota exceeded silently drops writes | Wrap writes in try/catch; prune stale data on quota error | `safeSetLocal()` wrapper |
| 18 | Alarms | Alarms lost after extension update or Chrome crash | Re-register in both `onInstalled` and `onStartup` | `ensureAlarmsRegistered()` |
| 19 | Alarms | Interval below 1 minute silently rounds up | Enforce `Math.max(interval, 1)` before `chrome.alarms.create` | Runtime guard |
| 20 | Identity | User cancels OAuth -- treated as error | Check error message for "user closed" and return null gracefully | Pattern in `startGoogleOAuth()` |
| 21 | Types | `any` type hides runtime type mismatches | Ban `any` in all production code | `@typescript-eslint/no-explicit-any` |
| 22 | Types | JSON.parse returns `any` | Validate parsed data against schema before use | `@typescript-eslint/no-unsafe-assignment` |
| 23 | UI | Double-click fires action twice | Disable button on first click; re-enable after operation completes | Debounce pattern |
| 24 | UI | Race condition: stale data from previous tab | Cancel pending fetches on tab switch; use AbortController | `useEffect` cleanup |
| 25 | Messaging | External message from unknown extension ID | Validate `sender.id` against allowlist before processing | `ZOVO_EXTENSION_IDS` Set check |

---

## 7. Debug Utility Module

```typescript
// src/shared/debug.ts
//
// Production-safe logging, error reporting, and performance timing.
// All output is gated behind a debug flag stored in chrome.storage.local.
// In production builds, debug.log calls are no-ops. Errors always log.

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  context: string;
}

const LOG_BUFFER_MAX = 200;
const logBuffer: LogEntry[] = [];
let debugEnabled: boolean | null = null;

async function isDebugEnabled(): Promise<boolean> {
  if (debugEnabled !== null) return debugEnabled;
  try {
    const result = await chrome.storage.local.get("zovo_debug_mode");
    debugEnabled = result.zovo_debug_mode === true;
  } catch {
    debugEnabled = false;
  }
  return debugEnabled;
}

function getContext(): string {
  if (typeof globalThis.document !== "undefined") return "popup";
  if (typeof globalThis.ServiceWorkerGlobalScope !== "undefined") return "sw";
  return "unknown";
}

function createEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    context: getContext(),
  };
}

function pushToBuffer(entry: LogEntry): void {
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) {
    logBuffer.shift();
  }
}

/** Production-safe logger. Only outputs when debug mode is enabled. */
export const debug = {
  async log(message: string, data?: Record<string, unknown>): Promise<void> {
    const entry = createEntry("debug", message, data);
    pushToBuffer(entry);
    if (await isDebugEnabled()) {
      console.log(`[Zovo:${entry.context}]`, message, data ?? "");
    }
  },

  async info(message: string, data?: Record<string, unknown>): Promise<void> {
    const entry = createEntry("info", message, data);
    pushToBuffer(entry);
    if (await isDebugEnabled()) {
      console.info(`[Zovo:${entry.context}]`, message, data ?? "");
    }
  },

  warn(message: string, data?: Record<string, unknown>): void {
    const entry = createEntry("warn", message, data);
    pushToBuffer(entry);
    // Warnings always log in development, never in production
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Zovo:${entry.context}]`, message, data ?? "");
    }
  },

  error(message: string, data?: Record<string, unknown>): void {
    const entry = createEntry("error", message, data);
    pushToBuffer(entry);
    // Errors always log, even in production (but no sensitive data)
    console.error(`[Zovo:${entry.context}]`, message);
    // Queue error for analytics (redacted)
    void queueErrorEvent(message);
  },

  /** Get buffered log entries for the debug panel. */
  getBuffer(): readonly LogEntry[] {
    return logBuffer;
  },

  /** Clear the log buffer. */
  clearBuffer(): void {
    logBuffer.length = 0;
  },
};

// ---- Performance Timing ----

const perfMarks = new Map<string, number>();

export const perf = {
  start(label: string): void {
    perfMarks.set(label, performance.now());
  },

  end(label: string): number {
    const start = perfMarks.get(label);
    perfMarks.delete(label);
    if (start == null) {
      debug.warn(`perf.end called without matching start: ${label}`);
      return 0;
    }
    const duration = performance.now() - start;
    void debug.log(`[perf] ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  },

  /** Wrap an async function with automatic timing. */
  async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      void debug.log(`[perf] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};

// ---- Error Reporting (anonymized) ----

async function queueErrorEvent(message: string): Promise<void> {
  try {
    const queue =
      (await chrome.storage.local.get("analytics_queue")).analytics_queue ?? [];
    queue.push({
      event: "extension_error",
      properties: {
        // Never include cookie values, URLs, or PII
        error_message: message.slice(0, 200),
        context: getContext(),
      },
      timestamp: new Date().toISOString(),
      session_id: crypto.randomUUID(),
    });
    await chrome.storage.local.set({ analytics_queue: queue });
  } catch {
    // If we cannot even queue errors, fail silently
  }
}

// ---- Debug Mode Toggle ----

export async function setDebugMode(enabled: boolean): Promise<void> {
  debugEnabled = enabled;
  await chrome.storage.local.set({ zovo_debug_mode: enabled });
}
```

Usage across the codebase:

```typescript
import { debug, perf } from "../shared/debug";

// Performance measurement
perf.start("popup-init");
const cookies = await chrome.cookies.getAll({ url: tabUrl });
perf.end("popup-init");

// Or with the wrapper
const cookies = await perf.measure("getAll cookies", () =>
  chrome.cookies.getAll({ url: tabUrl })
);

// Error reporting
debug.error("Profile load failed", { profileId, reason: "not_found" });

// Conditional debug output (only when flag is on)
await debug.log("Rendering cookie list", { count: cookies.length });
```

---

*This guide covers 7 areas of JavaScript error prevention for the Zovo Cookie Manager: ESLint configuration (40+ rules), Chrome API validation patterns for all 6 API surfaces, async/await error handling (5 patterns), service worker safety (6 restrictions with correct alternatives), TypeScript type safety (complete type definitions), a 25-item bug prevention checklist, and a production-safe debug utility module. Every code pattern is copy-pasteable into the `src/` directory.*
