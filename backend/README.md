# OneAPI — Enterprise Multi-Provider Proxy Gateway

**OneAPI** is an enterprise-grade API Gateway and Multi-Provider Proxy with **Automatic Failover** designed to abstract and unify third-party provider integrations behind a single developer dashboard and unified API.

---

## 🚀 Key Architectural Highlights

1. **5 Provider Domains Supported**:
   - 🤖 **AI**: Google Gemini (Primary) ➔ Groq / Pollinations AI (Fallback)
   - 🎵 **Music**: Deezer API (Primary) ➔ Apple iTunes Search API (Fallback)
   - ⛅ **Weather**: Open-Meteo API (Primary) ➔ Weatherstack / wttr.in (Fallback)
   - 📰 **News**: HackerNews Algolia (Primary) ➔ Spaceflight News API (Fallback)
   - 🌿 **Environment**: OpenAQ Air Quality (Primary) ➔ Open-Meteo Atmospheric Air (Fallback)
2. **Exactly 2 Demo Providers per Category**: Out of the box, each category has 1 Primary and 1 Secondary (Fallback) provider pre-registered.
3. **Extensible Provider Registry**: Developers can register new providers in under 20 lines of code via the `providerRegistry.register()` adapter API.
4. **AES-256-GCM Encrypted Key Vault**: Third-party API keys are encrypted at rest with 128-bit authentication tags and unique initialization vectors.
5. **Zero-Downtime Automatic Failover Engine**: If the primary provider times out or returns `429`, `500`, `502`, `503`, or `504`, the gateway seamlessly routes to the fallback provider in the same request cycle and injects `X-OneAPI-Fallback: true`.

---

## 📡 API Endpoints Overview

### 1. Developer Project & Encrypted Vault Management (`/api/v1/projects`)
*Requires `Authorization: Bearer <userJwtToken>`*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/projects` | Creates project; generates unique `projectId` (`proj_...`) and secret `oneapi_dev_token_...` |
| `GET` | `/api/v1/projects` | Lists all projects owned by developer |
| `GET` | `/api/v1/projects/:projectId` | Fetches project metadata, active routing rules, and vault secrets |
| `POST` | `/api/v1/projects/:projectId/vault` | Encrypts and stores a third-party API key in the AES-256-GCM vault |
| `GET` | `/api/v1/projects/:projectId/vault` | Lists masked key previews for a project |
| `DELETE` | `/api/v1/projects/:projectId/vault/:secretId` | Deletes a stored key from the vault |
| `PUT` | `/api/v1/projects/:projectId/routing` | Configures Primary and Fallback provider for a category |
| `GET` | `/api/v1/projects/:projectId/analytics` | Returns real-time request counts, latency, and fallback trigger rate |

---

### 2. Multi-Provider Gateway Proxy (`/api/v1/proxy`)
*Requires `Authorization: Bearer <oneapi_dev_token_...>` or `x-project-token` header*

| Method | Endpoint | Category | Unified Request Body / Query | Description |
|---|---|---|---|---|
| `GET` | `/api/v1/proxy/providers` | *All* | None (Public) | Lists all 5 categories, active default routing, and registered providers |
| `POST` | `/api/v1/proxy/ai/chat` | **AI** | `{ "messages": [{"role": "user", "content": "..."}], "model": "default" }` | Gemini ➔ Groq failover |
| `GET` / `POST` | `/api/v1/proxy/music/search` | **Music** | `?query=electronic&limit=10` or JSON body | Deezer ➔ iTunes failover |
| `GET` / `POST` | `/api/v1/proxy/weather/current` | **Weather** | `?city=London` or `{ "latitude", "longitude" }` | Open-Meteo ➔ Weatherstack failover |
| `GET` / `POST` | `/api/v1/proxy/news/search` | **News** | `?query=technology&limit=10` | HackerNews ➔ Spaceflight failover |
| `GET` / `POST` | `/api/v1/proxy/environment/air-quality` | **Environment** | `?city=Delhi` | OpenAQ ➔ Open-Meteo Air failover |

---

## 💻 Developer Extension: Adding a Custom Provider

Any developer can add a 3rd provider to any category by writing a standard adapter:

```typescript
import { providerRegistry, type IProviderAdapter } from './providers/index.js';

export class CustomWeatherAdapter implements IProviderAdapter {
  public readonly id = 'my_weather_service';
  public readonly category = 'weather' as const;
  public readonly displayName = 'Custom IoT Weather API';
  public readonly isKeyRequired = true;

  public async execute(params, config) {
    const res = await fetch(`https://api.myweather.com/v1?city=${params.city}&key=${config.apiKey}`);
    const data = await res.json();

    // Return unified OneAPI normalized structure
    return {
      location: params.city,
      current: {
        temperature: data.temp_c,
        humidity: data.humidity_pct,
        condition: data.summary,
        windSpeed: data.wind_kph,
      },
      provider: this.id,
      timestamp: new Date().toISOString(),
    };
  }
}

// Register into runtime
providerRegistry.register(new CustomWeatherAdapter());
```

---

## ⚡ Unified Response Metadata Headers

Every proxy response includes transparent telemetry headers:

| Header | Description |
|---|---|
| `X-OneAPI-Fallback` | `true` if primary provider failed and secondary executed; `false` otherwise |
| `X-OneAPI-Primary-Provider` | The initial provider targeted (e.g. `gemini` or `deezer`) |
| `X-OneAPI-Final-Provider` | The actual provider that delivered the response (e.g. `groq`) |
| `X-OneAPI-Latency-MS` | Total round-trip latency in milliseconds |
| `X-OneAPI-Fallback-Reason` | Error code that caused failover (e.g. `UPSTREAM_429` or `TIMEOUT_EXCEEDED`) |

---

## 🧪 Testing & Verification
```bash
# Run all 31 unit and integration tests
pnpm test

# Check TypeScript typing
pnpm typecheck

# Build production bundle
pnpm build

# Start live development server
pnpm dev
```
