# Product Requirement Document (PRD): OneAPI

**Project Name:** OneAPI  
**Author:** Sanskar Bandgar  
**Date:** November 2026  
**Status:** Draft / Architecture Specification

---

## 1. Document Overview & Executive Summary

### 1.1 Introduction
**OneAPI** is an enterprise-grade API Gateway and Multi-Provider Proxy with Automatic Failover designed to abstract and unify third-party provider integrations (such as AI models, weather data, and media APIs) behind a single developer dashboard and unified SDK.

### 1.2 Problem Statement
Modern developers building applications often face:
- **Vendor Lock-in:** Hardcoding a single provider (e.g., Gemini) makes switching expensive and time-consuming if pricing changes, features deprecate, or performance dips.
- **Service Downtime & Reliability Risks:** If a third-party provider goes down or encounters rate-limiting (`429 Too Many Requests`, `503 Service Unavailable`), the developer's application crashes or returns errors to their end-users.


### 1.3 Solution & Objectives
OneAPI solves these challenges by providing:
1. **Centralized Key Management:** Developers securely store provider API keys in an encrypted vault via the OneAPI dashboard.
2. **Unified SDK (`oneapi`):** A single clean interface (e.g., `oneapi.ai.chat()`, `oneapi.ai.upload_file()`) to interact with any backend service.
3. **Automatic Fallback Engine:** Real-time detection of provider failures with instant, transparent routing to a secondary provider of the same category.
4. **Zero-Code Provider Switching:** Toggle primary and secondary providers instantly from the OneAPI dashboard without modifying application source code.

---

## 2. Product Scope & Features

### 2.1 Developer Dashboard & Vault
- **Account Management:** User registration, authentication, and project generation yielding a unique OneAPI Project Token (`oneapi_dev_token_xxx`).
- **Secure Key Vault:** Interface to input, update, and delete third-party provider keys (Gemini, OpenWeather, YouTube, etc.). Keys are encrypted at rest using AES-256.
- **Routing Configuration:** Priority matrix configuration UI allowing developers to assign Primary and Secondary (Fallback) providers per category (e.g., AI, Weather, Media).
- **Analytics & Logs:** Real-time telemetry tracking request volumes, latency overhead, error rates, and fallback trigger counts.

### 2.2 OneAPI Backend Gateway & Proxy Engine
- **Token Authentication:** Validates incoming requests using the developer's OneAPI Project Token.
- **Dynamic Provider Resolution:** Resolves active provider configurations, retrieves decrypted keys from the vault, and constructs upstream requests.
- **Intelligent Fallback Engine:**
  - Captures HTTP error codes (`429`, `500`, `503`) or response timeouts (>3 seconds).
  - Automatically retries the request using the configured fallback provider within the same execution cycle.
- **Response Normalization (Adapter Layer):** Maps disparate third-party JSON schemas into a unified, predictable OneAPI output format.

### 2.3 Unified Client SDK (`@oneapi/sdk`)
- Clean initialization using the project token.
- Modular namespaces supporting multiple domains (e.g., `ai`, `weather`, `media`).
- Standardized method signatures ensuring developers never need to import provider-specific client libraries.

---

## 3. Technical Architecture & SDK Design

### 3.1 SDK Method Signatures & Usage Example
The SDK abstracts away underlying provider details. Below is the proposed JavaScript/TypeScript SDK design:

```javascript
import { OneAPI } from '@oneapi/sdk';

// Initialize OneAPI SDK
const oneapi = new OneAPI({
  apiKey: 'oneapi_dev_token_abc123',
  projectId: 'proj_xyz'
});

// 1. AI Chat Completion Example
async function runChat() {
  const response = await oneapi.ai.chat({
    model: 'default', // OneAPI handles mapping 'default' to active provider (e.g., Gemini)
    messages: [
      { role: 'user', content: 'Explain quantum computing in two sentences.' }
    ],
    temperature: 0.7
  });
  
  console.log(response.choices[0].message.content);
}

// 2. AI File Upload Example
async function uploadDocument(fileBuffer) {
  const uploadResult = await oneapi.ai.upload_file({
    file: fileBuffer,
    purpose: 'assistants'
  });
  
  console.log('Uploaded File ID:', uploadResult.fileId);
}
```

### 3.2 Request Lifecycle Flow
1. **Client Invocation:** Application calls `oneapi.ai.chat(...)` via the SDK.
2. **Gateway Reception:** OneAPI Backend receives the payload at `/api/v1/proxy/ai/chat` with header `Authorization: Bearer oneapi_dev_token_xxx`.
3. **Validation & Vault Lookup:** Gateway authenticates the token, checks project permissions, and fetches the decrypted Primary Provider API key (e.g., Gemini API Key).
4. **Upstream Request:** Gateway proxies the payload to the Primary Provider's endpoint.
5. **Failover Execution (Conditional):**
   - *If Success:* Returns normalized JSON response to SDK.
   - *If Failure (`429`/`500`/Timeout):* Logs failure event, fetches Fallback Provider credentials (e.g., Groq / OpenAI), and re-routes the payload instantly.
6. **Response Delivery:** Client receives a seamless response without noticing primary provider degradation.

---

## 4. Non-Functional Requirements (NFRs)

- **Performance & Latency:** Gateway overhead must add less than 50ms of median latency to requests. Deploy serverless/edge functions globally close to developer traffic.
- **Security & Compliance:**
  - API keys stored in vault must be encrypted at rest (AES-256-GCM).
  - All transit communications must enforce TLS 1.3 encryption.
  - Strict database row-level security ensuring developers can only access their own project keys.
- **Reliability & Availability:** Target 99.9% uptime for the OneAPI gateway infrastructure.
- **Scalability:** Stateless proxy architecture capable of scaling horizontally via container orchestration (e.g., Kubernetes) or serverless triggers.

---

## 5. Future Roadmap & Phases

- **Phase 1 (MVP):** Core proxy routing, encrypted key vault, basic dashboard UI, and support for AI chat endpoints (Gemini/OpenAI) with simple primary/fallback logic.
- **Phase 2:** Response normalization adapters across weather and media providers; circuit breaker pattern implementation to proactively isolate degraded providers.
- **Phase 3:** Advanced analytics dashboard, custom rate-limiting rules per developer project, and webhook alerts for fallback event notifications.