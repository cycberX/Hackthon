/**
 * =========================================================================
 * 🔑 ONEAPI CHAT APPLICATION - REQUIRED KEYS & CONFIGURATION LIST
 * =========================================================================
 *
 * To use this Chat Web Application with the OneAPI backend proxy gateway,
 * you need ONE of the following client authentication credentials:
 *
 * 1. PROJECT_TOKEN (Recommended for client apps & proxy gateways):
 *    - Header: 'x-project-token: oneapi_dev_...' or 'Authorization: Bearer oneapi_dev_...'
 *    - Where to get: Open Dashboard (http://localhost:3000/dashboard) -> "Projects" tab
 *      -> Copy your Project Token (e.g. 'oneapi_dev_68fbc319...')
 *    - Format: 'oneapi_dev_<hexadecimal_string>'
 *
 * 2. DEVELOPER API_KEY (Alternative client authentication):
 *    - Header: 'x-api-key: oneapi_...' or 'Authorization: ApiKey oneapi_...'
 *    - Where to get: Open Dashboard (http://localhost:3000/dashboard) -> "API Keys" tab
 *      -> Generate a new Developer API Key
 *    - Format: 'oneapi_<alphanumeric_key>'
 *
 * 3. USER JWT ACCESS TOKEN (For testing with active developer session):
 *    - Header: 'Authorization: Bearer <jwt_token>'
 *    - Where to get: Stored in localStorage after logging into the dashboard
 *
 * -------------------------------------------------------------------------
 * 🔒 THIRD-PARTY PROVIDER KEYS (Stored securely in Backend AES-256-GCM Vault):
 *    These are NOT stored in frontend code. The backend gateway automatically
 *    decrypts and forwards them to providers during failover:
 *
 *    - Google Gemini API Key (Primary AI Provider):
 *      Get free API key at: https://aistudio.google.com
 *      Store via: Dashboard -> "API Providers" -> Gemini -> "Connect / Config"
 *
 *    - Groq Cloud API Key (Automatic Fallback AI Provider):
 *      Get free API key at: https://console.groq.com
 *      Store via: Dashboard -> "API Providers" -> Groq -> "Connect / Config"
 *
 *    * Note: If third-party keys are not yet configured in the vault, the
 *      gateway will return an informative prompt indicating which provider key
 *      needs to be connected in the dashboard.
 * =========================================================================
 */

// Global Configuration
const CONFIG = {
  // Backend Proxy Base URL
  DEFAULT_BASE_URL: 'http://localhost:5000',

  // Local Storage Keys
  STORAGE_BASE_URL: 'oneapi_chat_base_url',
  STORAGE_PROJECT_TOKEN: 'oneapi_chat_project_token',
  STORAGE_API_KEY: 'oneapi_chat_api_key',
  STORAGE_HISTORY: 'oneapi_chat_history',
  STORAGE_SYSTEM_PROMPT: 'oneapi_chat_system_prompt',

  // Default System Prompt
  DEFAULT_SYSTEM_PROMPT:
    'You are OneAPI Assistant, an intelligent, helpful, and concise AI helper connected through the OneAPI Multi-Provider Failover Gateway.',
};

// Application State
const state = {
  baseUrl: localStorage.getItem(CONFIG.STORAGE_BASE_URL) || CONFIG.DEFAULT_BASE_URL,
  projectToken: localStorage.getItem(CONFIG.STORAGE_PROJECT_TOKEN) || '',
  apiKey: localStorage.getItem(CONFIG.STORAGE_API_KEY) || '',
  systemPrompt: localStorage.getItem(CONFIG.STORAGE_SYSTEM_PROMPT) || CONFIG.DEFAULT_SYSTEM_PROMPT,
  messages: [], // Array of { id, role: 'user' | 'assistant', content, timestamp, meta? }
  isLoading: false,
  serverOnline: false,
};

// DOM Elements
const elements = {
  baseUrlInput: document.getElementById('baseUrlInput'),
  projectTokenInput: document.getElementById('projectTokenInput'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveConfigBtn: document.getElementById('saveConfigBtn'),
  configToggleBtn: document.getElementById('configToggleBtn'),
  configPanel: document.getElementById('configPanel'),
  serverStatusDot: document.getElementById('serverStatusDot'),
  serverStatusText: document.getElementById('serverStatusText'),
  chatStream: document.getElementById('chatStream'),
  chatForm: document.getElementById('chatForm'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  exportChatBtn: document.getElementById('exportChatBtn'),
  quickPromptBtns: document.querySelectorAll('.quick-prompt-btn'),
  keyStatusBanner: document.getElementById('keyStatusBanner'),
  activeProviderDisplay: document.getElementById('activeProviderDisplay'),
};

// =========================================================================
// Initialization
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initUI();
  loadSavedMessages();
  checkServerHealth();
  setupEventListeners();

  // Periodic health check every 15 seconds
  setInterval(checkServerHealth, 15000);
});

function initUI() {
  if (elements.baseUrlInput) elements.baseUrlInput.value = state.baseUrl;
  if (elements.projectTokenInput) elements.projectTokenInput.value = state.projectToken;
  if (elements.apiKeyInput) elements.apiKeyInput.value = state.apiKey;
  updateKeyStatusBanner();
}

function setupEventListeners() {
  // Save Config
  if (elements.saveConfigBtn) {
    elements.saveConfigBtn.addEventListener('click', () => {
      state.baseUrl = elements.baseUrlInput.value.trim() || CONFIG.DEFAULT_BASE_URL;
      state.projectToken = elements.projectTokenInput.value.trim();
      state.apiKey = elements.apiKeyInput.value.trim();

      localStorage.setItem(CONFIG.STORAGE_BASE_URL, state.baseUrl);
      localStorage.setItem(CONFIG.STORAGE_PROJECT_TOKEN, state.projectToken);
      localStorage.setItem(CONFIG.STORAGE_API_KEY, state.apiKey);

      updateKeyStatusBanner();
      checkServerHealth();

      showToast('Configuration saved successfully!', 'success');
      if (elements.configPanel) elements.configPanel.classList.remove('open');
    });
  }

  // Toggle Config Panel
  if (elements.configToggleBtn && elements.configPanel) {
    elements.configToggleBtn.addEventListener('click', () => {
      elements.configPanel.classList.toggle('open');
    });
  }

  // Chat Form Submit
  if (elements.chatForm) {
    elements.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // Auto-resize & Enter key handling on Textarea
  if (elements.userInput) {
    elements.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    elements.userInput.addEventListener('input', () => {
      elements.userInput.style.height = 'auto';
      elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 160) + 'px';
    });
  }

  // Clear Chat
  if (elements.clearChatBtn) {
    elements.clearChatBtn.addEventListener('click', () => {
      if (confirm('Clear entire chat history?')) {
        state.messages = [];
        localStorage.removeItem(CONFIG.STORAGE_HISTORY);
        renderMessages();
      }
    });
  }

  // Export Chat
  if (elements.exportChatBtn) {
    elements.exportChatBtn.addEventListener('click', exportChatHistory);
  }

  // Quick Prompt Chips
  elements.quickPromptBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      if (prompt && elements.userInput) {
        elements.userInput.value = prompt;
        elements.userInput.focus();
        sendMessage();
      }
    });
  });
}

// =========================================================================
// Server Health & Status
// =========================================================================
async function checkServerHealth() {
  try {
    const res = await fetch(`${state.baseUrl}/health`);
    const data = await res.json();

    if (res.ok || data.status === 'ok' || data.status === 'degraded') {
      state.serverOnline = true;
      if (elements.serverStatusDot) elements.serverStatusDot.className = 'status-dot online';
      if (elements.serverStatusText) elements.serverStatusText.textContent = 'Backend Online (Port 5000)';
    } else {
      throw new Error('Unhealthy status');
    }
  } catch (err) {
    state.serverOnline = false;
    if (elements.serverStatusDot) elements.serverStatusDot.className = 'status-dot offline';
    if (elements.serverStatusText) elements.serverStatusText.textContent = 'Backend Offline';
  }
}

function updateKeyStatusBanner() {
  if (!elements.keyStatusBanner) return;

  const hasProjectToken = Boolean(state.projectToken.trim());
  const hasApiKey = Boolean(state.apiKey.trim());

  if (hasProjectToken || hasApiKey) {
    const keyType = hasProjectToken ? 'Project Token' : 'Developer API Key';
    const preview = hasProjectToken
      ? `${state.projectToken.slice(0, 14)}...`
      : `${state.apiKey.slice(0, 12)}...`;

    elements.keyStatusBanner.innerHTML = `
      <div class="key-status-pill connected">
        <span class="dot"></span>
        <span>Authenticated with <strong>${keyType}</strong> (<code>${preview}</code>)</span>
      </div>
    `;
  } else {
    elements.keyStatusBanner.innerHTML = `
      <div class="key-status-pill warning">
        <span class="dot"></span>
        <span>No Project Token configured. <a href="javascript:void(0)" onclick="document.getElementById('configPanel').classList.add('open')">Click here to enter token</a> or get one from the <a href="http://localhost:3000/dashboard" target="_blank">OneAPI Dashboard</a>.</span>
      </div>
    `;
  }
}

// =========================================================================
// Messaging & Proxy API Execution
// =========================================================================
async function sendMessage() {
  if (!elements.userInput) return;
  const text = elements.userInput.value.trim();
  if (!text || state.isLoading) return;

  // Check if credentials exist
  if (!state.projectToken.trim() && !state.apiKey.trim()) {
    showToast('Please enter your OneAPI Project Token or API Key in Settings first!', 'error');
    if (elements.configPanel) elements.configPanel.classList.add('open');
    return;
  }

  // 1. Add User Message
  const userMsg = {
    id: 'msg_' + Date.now(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
  };
  state.messages.push(userMsg);
  elements.userInput.value = '';
  elements.userInput.style.height = 'auto';

  // Render immediately
  renderMessages();
  scrollToBottom();

  // 2. Set Loading State
  state.isLoading = true;
  updateLoadingUI(true);

  // Add Assistant placeholder message with typing animation
  const tempAssistantId = 'temp_' + Date.now();
  renderTypingIndicator(tempAssistantId);

  const startTime = performance.now();

  try {
    // Prepare conversation payload for Proxy API
    // Format: messages array of { role: 'user' | 'assistant', content }
    const formattedMessages = state.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build Request Headers
    const headers = {
      'Content-Type': 'application/json',
    };

    if (state.projectToken.trim()) {
      headers['x-project-token'] = state.projectToken.trim();
    } else if (state.apiKey.trim()) {
      headers['x-api-key'] = state.apiKey.trim();
    }

    // Call OneAPI Gateway Proxy Endpoint
    const response = await fetch(`${state.baseUrl}/api/v1/proxy/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: formattedMessages,
        temperature: 0.7,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await response.json();

    removeTypingIndicator(tempAssistantId);

    if (response.ok && data.success) {
      // Extract Assistant Reply
      let assistantReply = '';
      if (data.data?.message?.content) {
        assistantReply = data.data.message.content;
      } else if (typeof data.data === 'string') {
        assistantReply = data.data;
      } else if (data.data?.response) {
        assistantReply = data.data.response;
      } else {
        assistantReply = JSON.stringify(data.data, null, 2);
      }

      // Metadata from Gateway Proxy headers and _oneapi object
      const providerUsed =
        response.headers.get('x-oneapi-provider') ||
        data._oneapi?.finalProvider ||
        data.data?.provider ||
        'gemini';

      const failoverOccurred =
        response.headers.get('x-oneapi-failover') === 'true' ||
        data._oneapi?.fallbackTriggered ||
        false;

      const assistantMsg = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toISOString(),
        meta: {
          provider: providerUsed,
          latencyMs: latencyMs,
          failover: failoverOccurred,
        },
      };

      state.messages.push(assistantMsg);
      saveMessages();
      renderMessages();

      // Update Top Active Provider Display
      if (elements.activeProviderDisplay) {
        elements.activeProviderDisplay.innerHTML = `
          <span class="provider-tag ${failoverOccurred ? 'fallback' : 'primary'}">
            ${failoverOccurred ? '🛡️ Fallback: ' + providerUsed : '⚡ Primary: ' + providerUsed} (${latencyMs}ms)
          </span>
        `;
      }
    } else {
      // Server Error / Missing Vault Key Error
      const errorMsg = data.error?.message || data.message || 'Error communicating with AI Gateway.';
      const errorCode = data.error?.code || 'GATEWAY_ERROR';

      const assistantErrorMsg = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: `⚠️ **OneAPI Gateway Error (${errorCode})**\n\n${errorMsg}\n\n*Tip: Ensure your Google Gemini or Groq API key is stored in your project's AES-256 Vault via the [OneAPI Dashboard](http://localhost:3000/dashboard).*`,
        timestamp: new Date().toISOString(),
        meta: {
          provider: 'gateway-error',
          latencyMs,
          failover: false,
          isError: true,
        },
      };

      state.messages.push(assistantErrorMsg);
      saveMessages();
      renderMessages();
    }
  } catch (err) {
    removeTypingIndicator(tempAssistantId);
    const latencyMs = Math.round(performance.now() - startTime);

    const networkErrorMsg = {
      id: 'msg_' + Date.now(),
      role: 'assistant',
      content: `❌ **Network Connection Error**\n\nUnable to reach backend at \`${state.baseUrl}\`.\n\nPlease verify that the OneAPI backend server is running on port 5000: \`pnpm dev\` in the \`backend/\` directory.`,
      timestamp: new Date().toISOString(),
      meta: {
        provider: 'offline',
        latencyMs,
        failover: false,
        isError: true,
      },
    };

    state.messages.push(networkErrorMsg);
    saveMessages();
    renderMessages();
  } finally {
    state.isLoading = false;
    updateLoadingUI(false);
    scrollToBottom();
  }
}

// =========================================================================
// UI Rendering & Message Display
// =========================================================================
function renderMessages() {
  if (!elements.chatStream) return;

  if (state.messages.length === 0) {
    elements.chatStream.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚡</div>
        <h2>OneAPI AI Assistant</h2>
        <p>A simple chat application powered by the OneAPI Multi-Provider Proxy Gateway with zero-downtime automatic failover.</p>
        <div class="feature-badges">
          <span class="badge">🔄 Gemini ➔ Groq Failover</span>
          <span class="badge">🔒 AES-256-GCM Vault</span>
          <span class="badge">⚡ Sub-second Latency</span>
        </div>
        <div class="quick-prompts-title">Try one of these quick prompts:</div>
        <div class="quick-prompts-grid">
          <button class="quick-prompt-btn" onclick="applyQuickPrompt('Explain how OneAPI failover protects applications from downtime in 2 bullet points.')">
            🛡️ How does automatic failover work?
          </button>
          <button class="quick-prompt-btn" onclick="applyQuickPrompt('Write a clean TypeScript fetch helper to call the OneAPI proxy gateway.')">
            💻 TypeScript OneAPI Fetch Helper
          </button>
          <button class="quick-prompt-btn" onclick="applyQuickPrompt('Compare Google Gemini 1.5 Flash vs Groq Llama 3 for developer applications.')">
            ⚡ Compare Gemini vs Groq
          </button>
          <button class="quick-prompt-btn" onclick="applyQuickPrompt('What are the security benefits of storing third-party API keys in an AES-256 vault?')">
            🔐 AES-256 Vault Benefits
          </button>
        </div>
      </div>
    `;
    return;
  }

  elements.chatStream.innerHTML = state.messages
    .map((msg) => {
      const isUser = msg.role === 'user';
      const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return `
        <div class="message-wrapper ${isUser ? 'user-message' : 'assistant-message'}">
          <div class="message-avatar">
            ${isUser ? '👤' : '⚡'}
          </div>
          <div class="message-bubble-container">
            <div class="message-header">
              <span class="message-sender">${isUser ? 'You' : 'OneAPI Assistant'}</span>
              <span class="message-time">${formattedTime}</span>
            </div>
            <div class="message-bubble ${msg.meta?.isError ? 'error-bubble' : ''}">
              ${formatMarkdown(msg.content)}
            </div>
            ${
              msg.meta && !isUser
                ? `
              <div class="message-meta-bar">
                <span class="meta-item provider-badge ${msg.meta.failover ? 'fallback' : 'primary'}">
                  ${msg.meta.failover ? '🛡️ Fallback: ' + msg.meta.provider : '⚡ Provider: ' + msg.meta.provider}
                </span>
                <span class="meta-item latency-badge">
                  ⏱️ ${msg.meta.latencyMs}ms
                </span>
                ${
                  msg.meta.failover
                    ? '<span class="meta-item failover-badge">🔄 Automatic Failover Triggered</span>'
                    : '<span class="meta-item direct-badge">✅ Direct Route</span>'
                }
              </div>
            `
                : ''
            }
          </div>
        </div>
      `;
    })
    .join('');
}

function renderTypingIndicator(tempId) {
  if (!elements.chatStream) return;
  const indicator = document.createElement('div');
  indicator.id = tempId;
  indicator.className = 'message-wrapper assistant-message typing-indicator-wrapper';
  indicator.innerHTML = `
    <div class="message-avatar">⚡</div>
    <div class="message-bubble-container">
      <div class="message-header">
        <span class="message-sender">OneAPI Assistant</span>
      </div>
      <div class="message-bubble typing-bubble">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span class="typing-label">Querying multi-provider proxy gateway...</span>
      </div>
    </div>
  `;
  elements.chatStream.appendChild(indicator);
  scrollToBottom();
}

function removeTypingIndicator(tempId) {
  const el = document.getElementById(tempId);
  if (el) el.remove();
}

function updateLoadingUI(loading) {
  if (elements.sendBtn) {
    elements.sendBtn.disabled = loading;
    elements.sendBtn.innerHTML = loading
      ? '<span class="spinner"></span>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
  }
}

function scrollToBottom() {
  if (elements.chatStream) {
    elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
  }
}

// Global helper for inline prompt clicks
window.applyQuickPrompt = function (text) {
  if (elements.userInput) {
    elements.userInput.value = text;
    elements.userInput.focus();
    sendMessage();
  }
};

// =========================================================================
// Storage & Utilities
// =========================================================================
function saveMessages() {
  localStorage.setItem(CONFIG.STORAGE_HISTORY, JSON.stringify(state.messages.slice(-50)));
}

function loadSavedMessages() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_HISTORY);
    if (raw) {
      state.messages = JSON.parse(raw);
    }
  } catch (e) {
    state.messages = [];
  }
  renderMessages();
}

function exportChatHistory() {
  if (state.messages.length === 0) {
    showToast('No messages to export.', 'error');
    return;
  }
  const blob = new Blob([JSON.stringify(state.messages, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `oneapi-chat-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Chat history exported!', 'success');
}

// Simple, safe Markdown parser for Code Blocks, Bold, Lists
function formatMarkdown(text) {
  if (!text) return '';

  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Triple backticks Code Blocks
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<div class="code-block"><div class="code-header">${lang || 'code'}</div><pre><code>${code.trim()}</code></pre></div>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet points
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Line breaks to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}
