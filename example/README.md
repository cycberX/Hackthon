# OneAPI Interactive Multi-Category Examples & Demos

A suite of 4 standalone, production-ready web applications built with vanilla HTML5, CSS3, and modern JavaScript, powered by the **OneAPI Multi-Provider Proxy Gateway**.

---

## 📱 Included Example Applications

| App | File | Gateway Proxy Endpoint | Failover Route |
| :--- | :--- | :--- | :--- |
| **ChatGPT-Style AI Assistant** | [`index.html`](./index.html) | `POST /api/v1/proxy/ai/chat` | Google Gemini &rarr; Groq Cloud &rarr; OpenRouter |
| **Real-time Weather Station** | [`weather.html`](./weather.html) | `GET /api/v1/proxy/weather/current?city=...` | Open-Meteo &rarr; Weatherstack / wttr.in |
| **Music Catalog & Audio Player** | [`music.html`](./music.html) | `GET /api/v1/proxy/music/search?q=...` | Deezer Music &rarr; Apple iTunes Search |
| **Air Quality Monitor** | [`environment.html`](./environment.html) | `GET /api/v1/proxy/environment/air-quality?city=...` | OpenAQ v3 &rarr; Open-Meteo Atmospheric Air |

---

## 🔑 Required Keys & Configuration List

All client requests to the gateway are authenticated with a single Developer API Key:

* **Developer API Key:**
  * **Header:** `Authorization: Bearer sk_live_...` or `x-api-key: sk_live_...`
  * **Where to get:** Open Developer Dashboard (`http://localhost:3000/dashboard/keys`) &rarr; **API Keys** page &rarr; Create Key.
  * **Format:** `sk_live_<hex_string>`
* **Server-Side AES-256 Vault:**
  * Provider API keys (Google Gemini, Groq, OpenRouter) are **never exposed in client code**.
  * They are safely stored encrypted in your developer vault via Dashboard &rarr; **API Providers** &rarr; **Connect / Config**.

---

## 🚀 How to Run the Examples

### Option 1: Direct File Open
Double click any HTML file or open directly in your browser:
* `file:///d:/hackthon/hack-vsak/example/index.html` (AI Chatbot)
* `file:///d:/hackthon/hack-vsak/example/weather.html` (Weather Station)
* `file:///d:/hackthon/hack-vsak/example/music.html` (Music Player)
* `file:///d:/hackthon/hack-vsak/example/environment.html` (Air Quality)

### Option 2: Express Backend Static Route
The backend serves the examples directory directly:
* `http://localhost:5000/example` (AI Chatbot)
* `http://localhost:5000/example/weather.html` (Weather Station)
* `http://localhost:5000/example/music.html` (Music Player)
* `http://localhost:5000/example/environment.html` (Air Quality)

### Option 3: Local Static Server
```bash
npx serve example -p 8080
```
Then visit `http://localhost:8080`.
