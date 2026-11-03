# OneAPI Chat — Multi-Provider Proxy AI Assistant

A complete, standalone chatting web application built with vanilla HTML, CSS, and modern JavaScript, powered by the **OneAPI Multi-Provider Proxy Gateway** (`POST /api/v1/proxy/ai/chat`).

---

## 🔑 Required Keys & Configuration List

The required keys and credentials are documented directly at the top of [`example/app.js`](app.js#L1-L45) and can be configured through the **Credentials Panel** in the UI:

### 1. Client Authentication Credentials (Need ONE of the following):
- **Project Gateway Token (Recommended):**
  - **Header:** `x-project-token: oneapi_dev_...` (or `Authorization: Bearer oneapi_dev_...`)
  - **Where to get:** Open Developer Dashboard (`http://localhost:3000/dashboard`) &rarr; **Projects** tab &rarr; Copy Project Token.
  - **Format:** `oneapi_dev_<48 hex chars>`
- **Developer API Key (Alternative):**
  - **Header:** `x-api-key: oneapi_...`
  - **Where to get:** Dashboard &rarr; **API Keys** tab &rarr; Generate Key.
  - **Format:** `oneapi_<token>`

### 2. Backend Third-Party Provider Keys (Stored in AES-256-GCM Vault):
These keys are **never exposed in frontend code**. The backend gateway automatically decrypts and routes them during requests:
- **Google Gemini API Key (Primary AI Provider):**
  - Free API Key from: [https://aistudio.google.com](https://aistudio.google.com)
  - Configure via: Dashboard &rarr; **API Providers** &rarr; Gemini &rarr; **Connect / Config**
- **Groq Cloud API Key (Automatic Fallback AI Provider):**
  - Free API Key from: [https://console.groq.com](https://console.groq.com)
  - Configure via: Dashboard &rarr; **API Providers** &rarr; Groq &rarr; **Connect / Config**

---

## 🚀 How to Run the Chat App

### Option 1: Direct File Open
Open `example/index.html` directly in any web browser:
```text
file:///d:/hackthon/hack-vsak/example/index.html
```

### Option 2: Run with any Local Static Server
```bash
# Using npx serve (runs on port 8080 or any free port)
npx serve example -p 8080

# Or using Python 3
cd example
python -m http.server 8080
```
Then visit `http://localhost:8080`.

---

## ⚡ How It Works with the Backend Proxy

```
┌────────────────────────┐
│  example/index.html    │ (Chat Web App)
└───────────┬────────────┘
            │  POST /api/v1/proxy/ai/chat
            │  Header: x-project-token: oneapi_dev_...
            ▼
┌────────────────────────┐
│  OneAPI Gateway        │ (Backend: http://localhost:5000)
│  - Decrypts Vault Key  │
│  - Checks Health       │
└───────────┬────────────┘
            │
            ├─► 1. Primary: Google Gemini 1.5 Flash ───► (Response)
            │      (If 429, Timeout, or Outage)
            │
            └─► 2. Fallback: Groq Cloud Llama 3 ────────► (Response)
```

1. The chat app sends conversation messages to `http://localhost:5000/api/v1/proxy/ai/chat`.
2. The OneAPI Gateway resolves the project routing rules and decrypts the provider credential from the AES-256-GCM vault.
3. If Google Gemini responds normally, it returns the reply with header `x-oneapi-provider: gemini`.
4. If Gemini encounters rate-limiting (429) or timeouts, the gateway automatically executes the query on Groq Cloud and returns the response with `x-oneapi-failover: true` and `x-oneapi-provider: groq`.
5. The chat UI immediately reflects whether the primary provider or fallback provider fulfilled the query alongside latency in milliseconds.

---

## 🧪 Features Included
- **Zero-Downtime Multi-Provider AI Chat:** Full conversation history sent to the proxy endpoint.
- **Provider & Latency Telemetry:** Real-time badges for provider used, latency (ms), and automatic failover flags.
- **Typing Indicator Animation:** Pulsing dots while waiting for the proxy gateway.
- **Markdown Support:** Syntax-highlighted code blocks, inline code, bold text, and lists.
- **Quick Prompts:** 4 pre-built developer prompts for instant testing.
- **Local Persistence:** Chat history and credentials saved in `localStorage`.
- **Export Option:** Export chat logs to JSON with 1 click.
