# @oneapi/sdk

> Unified JavaScript & TypeScript SDK for **OneAPI Gateway** with Automated Multi-Provider Failover.

[![npm version](https://img.shields.io/badge/npm-v1.1.0-blue.svg)](https://hackthon-seven-gules.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18](https://img.shields.io/badge/Node-%3E%3D18-green.svg)](https://nodejs.org)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)]()

---

## ⚡ Features

- 🛡️ **Zero External Dependencies** — Built on native `fetch` and web standards for maximum performance and security.
- 🔄 **Automated Multi-Provider Failover** — If a primary provider experiences rate limits, downtime, or timeouts, requests fail over instantly and transparently to backup providers.
- 🌐 **Pre-configured Production Gateway** — Pre-configured to point directly to `https://hackthon-seven-gules.vercel.app/api/v1`.
- 📊 **Telemetry Capture** — Inspect `providerUsed`, `usedFallback`, `fallbackReason`, and `latencyMs` directly on responses.
- 📦 **Native TypeScript Definitions** — Complete type declarations out of the box.

---

## 📦 Installation

```bash
npm install @oneapi/sdk
```

---

## 🚀 Quick Start

```javascript
import { OneAPI } from '@oneapi/sdk';

// Initialize with your OneAPI key
const oneapi = new OneAPI({
  apiKey: process.env.ONEAPI_API_KEY || 'sk_live_demo',
  projectId: 'default',
});

// AI Chat with automatic failover (Gemini -> Groq -> OpenRouter)
const response = await oneapi.ai.chat({
  prompt: 'Explain quantum computing in one sentence.',
});

console.log(response.content);
console.log('Provider used:', response.providerUsed);
console.log('Fallback triggered:', response.usedFallback);
console.log('Latency:', response.latencyMs, 'ms');
```

---

## 🌐 Gateway Configuration

The SDK automatically defaults to the production OneAPI cloud gateway:
```
https://hackthon-seven-gules.vercel.app/api/v1
```

You can customize this via environment variables without changing your application code:

```bash
# In your .env file
ONEAPI_BASE_URL=https://hackthon-seven-gules.vercel.app/api/v1
ONEAPI_API_KEY=sk_live_your_key_here
ONEAPI_PROJECT_ID=default
```

---

## 📚 Domains & Supported Methods

### 1. AI Chat & Completions
Automatic cascade across **Google Gemini** -> **Groq Cloud** -> **OpenRouter**.

```javascript
// Using prompt shorthand:
const res = await oneapi.ai.chat({
  prompt: 'Hello world!',
  model: 'default',
  temperature: 0.7,
});

// Or structured messages:
const res = await oneapi.ai.chat({
  messages: [
    { role: 'system', content: 'You are a concise assistant.' },
    { role: 'user', content: 'What is OneAPI?' }
  ],
});

console.log(res.content);
console.log(res.usage); // { promptTokens, completionTokens, totalTokens }
```

### 2. Weather
Current weather with failover across **Open-Meteo** and **Weatherstack**.

```javascript
const weather = await oneapi.weather.current({
  city: 'San Francisco',
});

console.log(weather.location);
console.log(weather.current.temperature, '°C');
console.log(weather.current.condition);
console.log(weather.provider);
```

### 3. Music Search
Music discovery across **Deezer** and **Apple iTunes**.

```javascript
const music = await oneapi.music.search({
  query: 'Daft Punk',
  limit: 5,
});

for (const track of music.tracks) {
  console.log(`${track.title} by ${track.artist} (${track.durationFormatted})`);
  console.log('Preview:', track.previewUrl);
}
```

### 4. News Radar
Breaking news queries across **HackerNews** and **Spaceflight News**.

```javascript
const news = await oneapi.news.search({
  query: 'artificial intelligence',
  limit: 5,
});

for (const article of news.articles) {
  console.log(`[${article.source}] ${article.title}`);
  console.log(article.url);
}
```

### 5. Environment & Air Quality
Ambient air quality index across **OpenAQ** and **Open-Meteo Air**.

```javascript
const env = await oneapi.environment.airQuality({
  city: 'London',
});

console.log('AQI:', env.airQuality.aqi, `(${env.airQuality.status})`);
console.log('PM2.5:', env.airQuality.pm25, 'µg/m³');
```

### 6. Provider Registry & Health
Inspect the gateway status and all active provider routes:

```javascript
// Gateway operational check
const health = await oneapi.health.check();
console.log('Gateway status:', health.status);

// Provider catalog & active failover chains
const providers = await oneapi.providers.list();
console.log('Registered providers:', providers.totalRegistered);
```

---

## 🛡️ Error Handling

The SDK throws descriptive `OneAPIError` instances with HTTP status code and provider metadata:

```javascript
import { OneAPI, OneAPIError } from '@oneapi/sdk';

try {
  const res = await oneapi.ai.chat({ prompt: 'Hello' });
} catch (error) {
  if (error instanceof OneAPIError) {
    console.error('Status:', error.statusCode);
    console.error('Code:', error.code);
    console.error('Provider:', error.provider);
    console.error('Message:', error.message);
  }
}
```

---

## 📄 License

MIT © 2026 OneAPI Team

