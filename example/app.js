/**
 * =========================================================================
 * OneAPI ChatGPT-Style Application Logic
 * =========================================================================
 */

const STORAGE_KEYS = {
  PROJECT_ID: 'oneapi_chat_project_id',
  API_KEY: 'oneapi_chat_api_key',
  SESSIONS: 'oneapi_chat_sessions',
  ACTIVE_SESSION_ID: 'oneapi_chat_active_session',
  PROVIDER: 'oneapi_chat_selected_provider',
  MODEL: 'oneapi_chat_selected_model',
};

const DEFAULT_CONFIG = {
  BASE_URL:
    (typeof window !== 'undefined' &&
      (window.ONEAPI_CONFIG?.BASE_URL ||
        window.ONEAPI_BASE_URL ||
        window.API_BASE_URL ||
        localStorage.getItem('oneapi_base_url'))) ||
    'http://localhost:5000',
  PROVIDER: 'auto',
  MODEL: 'auto',
};

const SUGGESTIONS = [
  {
    title: 'Explain OneAPI failover',
    desc: 'How automated failover prevents app downtime',
    prompt: 'Explain how OneAPI automated failover protects applications from unexpected upstream outages in 2 concise bullet points.',
  },
  {
    title: 'Compare Gemini with Groq',
    desc: 'Tradeoffs between multimodal and LPU speed',
    prompt: 'Compare Google Gemini 3.5 Flash Lite with Groq Llama 3.3 70B in terms of speed, context size, and typical production use cases.',
  },
  {
    title: 'Write a TypeScript proxy client',
    desc: 'Sample code using fetch with x-api-key',
    prompt: 'Write a clean TypeScript function that calls OneAPI /api/v1/proxy/ai/chat with an x-api-key header and handles the JSON response safely.',
  },
  {
    title: 'Simulate upstream outage',
    desc: 'How the failover matrix seamlessly recovers',
    prompt: 'What happens under the hood when a primary provider returns a 429 rate-limit error or 503 gateway outage in OneAPI?',
  },
];

// App State
const state = {
  baseUrl: DEFAULT_CONFIG.BASE_URL,
  projectId: localStorage.getItem(STORAGE_KEYS.PROJECT_ID) || '',
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) || '',
  selectedProvider: localStorage.getItem(STORAGE_KEYS.PROVIDER) || DEFAULT_CONFIG.PROVIDER,
  selectedModel: localStorage.getItem(STORAGE_KEYS.MODEL) || DEFAULT_CONFIG.MODEL,
  sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]'),
  activeSessionId: localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID) || null,
  isLoading: false,
  gatewayOnline: false,
};

// DOM References
const elements = {
  sidebar: document.getElementById('sidebar'),
  sidebarToggleBtn: document.getElementById('sidebarToggleBtn'),
  sidebarCloseBtn: document.getElementById('sidebarCloseBtn'),
  newChatBtn: document.getElementById('newChatBtn'),
  chatHistoryList: document.getElementById('chatHistoryList'),
  chatStream: document.getElementById('chatStream'),
  chatForm: document.getElementById('chatForm'),
  userInput: document.getElementById('userInput'),
  sendBtn: document.getElementById('sendBtn'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  modelDropdownBtn: document.getElementById('modelDropdownBtn'),
  modelDropdownMenu: document.getElementById('modelDropdownMenu'),
  currentModelName: document.getElementById('currentModelName'),
  activeEngineChip: document.getElementById('activeEngineChip'),
  gatewayStatusPill: document.getElementById('gatewayStatusPill'),
  statusCircle: document.getElementById('statusCircle'),
  statusLabel: document.getElementById('statusLabel'),
  credentialsModal: document.getElementById('credentialsModal'),
  credentialsPill: document.getElementById('credentialsPill'),
  configModalTrigger: document.getElementById('configModalTrigger'),
  modalCloseBtn: document.getElementById('modalCloseBtn'),
  projectIdInput: document.getElementById('projectIdInput'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  saveCredentialsBtn: document.getElementById('saveCredentialsBtn'),
  sidebarKeyDisplay: document.getElementById('sidebarKeyDisplay'),
  sidebarKeyStatus: document.getElementById('sidebarKeyStatus'),
  toggleApiKeyVisibility: document.getElementById('toggleApiKeyVisibility'),
};

// =========================================================================
// Initialization
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Sync latest raw developer API key if stored from dashboard session
  if (!state.apiKey) {
    const dashboardKey = localStorage.getItem('oneapi_latest_raw_developer_api_key');
    if (dashboardKey) {
      state.apiKey = dashboardKey;
      localStorage.setItem(STORAGE_KEYS.API_KEY, dashboardKey);
    }
  }

  // Ensure an active session exists
  if (!state.activeSessionId || !state.sessions.find((s) => s.id === state.activeSessionId)) {
    createNewSession();
  }

  setupEventListeners();
  updateCredentialsDisplay();
  updateModelUI();
  renderHistory();
  renderActiveChat();
  checkGatewayHealth();

  // Periodic health check
  setInterval(checkGatewayHealth, 15000);
});

// =========================================================================
// Session Management
// =========================================================================
function createNewSession() {
  const newSession = {
    id: 'chat_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    title: 'New chat',
    messages: [],
    createdAt: new Date().toISOString(),
  };

  state.sessions.unshift(newSession);
  state.activeSessionId = newSession.id;
  persistSessions();
  renderHistory();
  renderActiveChat();
  elements.userInput.focus();
}

function persistSessions() {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(state.sessions));
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, state.activeSessionId);
}

function getActiveSession() {
  return state.sessions.find((s) => s.id === state.activeSessionId) || null;
}

function deleteSession(sessionId, e) {
  if (e) e.stopPropagation();
  state.sessions = state.sessions.filter((s) => s.id !== sessionId);
  if (state.activeSessionId === sessionId) {
    state.activeSessionId = state.sessions[0]?.id || null;
    if (!state.activeSessionId) {
      createNewSession();
      return;
    }
  }
  persistSessions();
  renderHistory();
  renderActiveChat();
}

function switchSession(sessionId) {
  state.activeSessionId = sessionId;
  persistSessions();
  renderHistory();
  renderActiveChat();
  // On mobile, auto-close sidebar after switching
  if (window.innerWidth < 768) {
    elements.sidebar.classList.add('collapsed');
  }
}

// =========================================================================
// Rendering
// =========================================================================
function renderHistory() {
  elements.chatHistoryList.innerHTML = '';
  if (state.sessions.length === 0) {
    elements.chatHistoryList.innerHTML = '<div style="padding: 10px; color: #8e8e8e; font-size: 11px;">No chats yet</div>';
    return;
  }

  state.sessions.forEach((s) => {
    const item = document.createElement('div');
    item.className = `history-item ${s.id === state.activeSessionId ? 'active' : ''}`;
    item.innerHTML = `
      <span class="history-title">${escapeHtml(s.title || 'New chat')}</span>
      <button class="history-del-btn" title="Delete chat">✕</button>
    `;

    item.addEventListener('click', () => switchSession(s.id));
    item.querySelector('.history-del-btn').addEventListener('click', (e) => deleteSession(s.id, e));
    elements.chatHistoryList.appendChild(item);
  });
}

function renderActiveChat() {
  const session = getActiveSession();
  elements.chatStream.innerHTML = '';

  if (!session || session.messages.length === 0) {
    renderEmptyState();
    return;
  }

  session.messages.forEach((msg) => {
    appendMessageDOM(msg);
  });

  scrollToBottom();
}

function renderEmptyState() {
  const emptyDiv = document.createElement('div');
  emptyDiv.className = 'empty-state';
  emptyDiv.innerHTML = `
    <div class="empty-logo">⚡</div>
    <h1 class="empty-title">What can I help with today?</h1>
    <p class="empty-subtitle">
      Connected to OneAPI Multi-Provider Proxy Gateway with real-time automatic failover across Gemini, Groq, and OpenRouter.
    </p>

    <div class="suggestion-grid">
      ${SUGGESTIONS.map(
        (s, i) => `
        <div class="suggestion-card" data-index="${i}">
          <div class="card-title">${s.title}</div>
          <div class="card-desc">${s.desc}</div>
        </div>
      `
      ).join('')}
    </div>
  `;

  emptyDiv.querySelectorAll('.suggestion-card').forEach((card) => {
    card.addEventListener('click', () => {
      const idx = card.getAttribute('data-index');
      elements.userInput.value = SUGGESTIONS[idx].prompt;
      handleSendMessage();
    });
  });

  elements.chatStream.appendChild(emptyDiv);
}

function appendMessageDOM(msg) {
  const isUser = msg.role === 'user';
  const row = document.createElement('div');
  row.className = `message-row ${isUser ? 'user' : 'assistant'}`;

  let bodyHtml = '';
  if (isUser) {
    bodyHtml = `<div class="message-bubble">${escapeHtml(msg.content)}</div>`;
  } else {
    bodyHtml = `
      <div class="message-sender">OneAPI Assistant</div>
      <div class="message-bubble">${formatMarkdown(msg.content)}</div>
    `;

    if (msg.meta) {
      const isFallback = Boolean(msg.meta.fallbackTriggered);
      bodyHtml += `
        <div class="telemetry-pill ${isFallback ? 'fallback' : ''}">
          <span>${isFallback ? '🔄 Fallback Provider:' : '⚡ Provider:'} <strong>${msg.meta.finalProvider}</strong></span>
          <span>&bull;</span>
          <span>⏱ ${msg.meta.latencyMs}ms</span>
          <span>&bull;</span>
          <span>${msg.meta.status || 200} OK</span>
        </div>
      `;
    }
  }

  row.innerHTML = `
    <div class="message-inner">
      <div class="message-avatar ${isUser ? 'user' : 'assistant'}">
        ${isUser ? '👤' : '⚡'}
      </div>
      <div class="message-body">
        ${bodyHtml}
      </div>
    </div>
  `;

  // Attach code copy listeners
  row.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const codeText = btn.getAttribute('data-code');
      navigator.clipboard.writeText(codeText);
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 2000);
    });
  });

  elements.chatStream.appendChild(row);
}

function appendTypingIndicator() {
  const row = document.createElement('div');
  row.id = 'typingIndicator';
  row.className = 'message-row assistant';
  row.innerHTML = `
    <div class="message-inner">
      <div class="message-avatar assistant">⚡</div>
      <div class="message-body">
        <div class="message-sender">OneAPI Assistant</div>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  elements.chatStream.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

function scrollToBottom() {
  elements.chatStream.scrollTop = elements.chatStream.scrollHeight;
}

// =========================================================================
// API & Communication
// =========================================================================
async function handleSendMessage() {
  const text = elements.userInput.value.trim();
  if (!text || state.isLoading) return;

  const session = getActiveSession();
  if (!session) return;

  // Set chat title from first prompt
  if (session.messages.length === 0) {
    session.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
    renderHistory();
  }

  // Remove empty state if present
  const emptyState = elements.chatStream.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  // Add User Message
  const userMsg = {
    id: 'msg_' + Date.now(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(userMsg);
  appendMessageDOM(userMsg);
  elements.userInput.value = '';
  updateInputHeight();
  persistSessions();
  scrollToBottom();

  state.isLoading = true;
  elements.sendBtn.disabled = true;
  appendTypingIndicator();

  const startTime = performance.now();

  try {
    const payload = {
      messages: session.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (state.selectedModel !== 'auto') {
      payload.provider = state.selectedModel;
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (state.apiKey) {
      headers['x-api-key'] = state.apiKey;
      headers['Authorization'] = `Bearer ${state.apiKey}`;
    }

    if (state.projectId) {
      headers['x-project-id'] = state.projectId;
    }

    if (state.selectedProvider && state.selectedProvider !== 'auto') {
      headers['x-oneapi-provider'] = state.selectedProvider;
      payload.provider = state.selectedProvider;
    }

    if (state.selectedModel && state.selectedModel !== 'auto') {
      headers['x-oneapi-model'] = state.selectedModel;
      payload.model = state.selectedModel;
    }

    const response = await fetch(`${state.baseUrl.replace(/\/$/, '')}/api/v1/proxy/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await response.json();
    removeTypingIndicator();

    if (!response.ok || data.success === false) {
      const errorMsg = data.error?.message || `Gateway returned status ${response.status}`;
      const assistantMsg = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Proxy Gateway Error**: ${errorMsg}\n\n*Tip: Connect your API Key in Settings or visit the OneAPI Dashboard to verify vault provider keys.*`,
        meta: {
          finalProvider: state.selectedModel === 'auto' ? 'gateway' : state.selectedModel,
          latencyMs,
          status: response.status,
          fallbackTriggered: false,
        },
      };

      session.messages.push(assistantMsg);
      appendMessageDOM(assistantMsg);
      persistSessions();
      scrollToBottom();
      return;
    }

    // Extract assistant response content
    const content =
      data.data?.choices?.[0]?.message?.content ||
      data.choices?.[0]?.message?.content ||
      data.data?.content ||
      data.content ||
      'Response received.';

    const finalProvider =
      data._oneapi?.finalProvider ||
      data.data?._oneapi?.finalProvider ||
      data.data?.provider ||
      data.provider ||
      (state.selectedModel !== 'auto' ? state.selectedModel : 'gemini');

    const fallbackTriggered = Boolean(data._oneapi?.fallbackTriggered || data.data?._oneapi?.fallbackTriggered);

    const assistantMsg = {
      id: 'msg_' + Date.now(),
      role: 'assistant',
      content,
      meta: {
        finalProvider,
        latencyMs: data._oneapi?.latencyMs || latencyMs,
        status: 200,
        fallbackTriggered,
      },
    };

    session.messages.push(assistantMsg);
    appendMessageDOM(assistantMsg);
    persistSessions();
    scrollToBottom();
  } catch (err) {
    removeTypingIndicator();
    const assistantMsg = {
      id: 'msg_' + Date.now(),
      role: 'assistant',
      content: `❌ **Connection Failed**: Unable to reach backend gateway at \`${state.baseUrl}\`.\n\nEnsure backend server is running (\`pnpm --prefix backend dev\`) and your API Key is valid.`,
      meta: {
        finalProvider: 'network',
        latencyMs: Math.round(performance.now() - startTime),
        status: 500,
        fallbackTriggered: false,
      },
    };

    session.messages.push(assistantMsg);
    appendMessageDOM(assistantMsg);
    persistSessions();
    scrollToBottom();
  } finally {
    state.isLoading = false;
    updateInputState();
  }
}

// =========================================================================
// Health Check
// =========================================================================
async function checkGatewayHealth() {
  try {
    const res = await fetch(`${state.baseUrl.replace(/\/$/, '')}/health`, { method: 'GET' });
    const data = await res.json();
    state.gatewayOnline = res.ok && data.status === 'HEALTHY';
    elements.statusCircle.className = `status-circle ${state.gatewayOnline ? 'online' : 'offline'}`;
    elements.statusLabel.textContent = state.gatewayOnline ? 'Gateway 5000 Online' : 'Gateway Degraded';
  } catch {
    state.gatewayOnline = false;
    elements.statusCircle.className = 'status-circle offline';
    elements.statusLabel.textContent = 'Gateway Offline';
  }
}

// =========================================================================
// Event Listeners & UI Helpers
// =========================================================================
function setupEventListeners() {
  // Sidebar toggle
  elements.sidebarToggleBtn.addEventListener('click', () => {
    elements.sidebar.classList.toggle('collapsed');
  });

  elements.sidebarCloseBtn.addEventListener('click', () => {
    elements.sidebar.classList.add('collapsed');
  });

  // New Chat
  elements.newChatBtn.addEventListener('click', createNewSession);

  // Clear Chat
  elements.clearChatBtn.addEventListener('click', () => {
    if (confirm('Clear messages in this chat session?')) {
      const session = getActiveSession();
      if (session) {
        session.messages = [];
        session.title = 'New chat';
        persistSessions();
        renderHistory();
        renderActiveChat();
      }
    }
  });

  // Chat Form Submit
  elements.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  // Textarea auto-resize and Enter key handling
  elements.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  elements.userInput.addEventListener('input', () => {
    updateInputHeight();
    updateInputState();
  });

  // Model dropdown toggle
  elements.modelDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.modelDropdownMenu.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    elements.modelDropdownMenu.classList.remove('open');
  });

  // Model selector options
  elements.modelDropdownMenu.querySelectorAll('.model-option').forEach((opt) => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const p = opt.getAttribute('data-provider') || 'auto';
      const m = opt.getAttribute('data-model') || 'auto';
      state.selectedProvider = p;
      state.selectedModel = m;
      localStorage.setItem(STORAGE_KEYS.PROVIDER, p);
      localStorage.setItem(STORAGE_KEYS.MODEL, m);
      updateModelUI();
      elements.modelDropdownMenu.classList.remove('open');
    });
  });

  // Credentials Modal
  const openModal = () => {
    if (elements.projectIdInput) elements.projectIdInput.value = state.projectId;
    elements.apiKeyInput.value = state.apiKey;
    elements.credentialsModal.classList.add('open');
  };

  const closeModal = () => {
    elements.credentialsModal.classList.remove('open');
  };

  elements.credentialsPill.addEventListener('click', openModal);
  elements.configModalTrigger.addEventListener('click', openModal);
  elements.modalCloseBtn.addEventListener('click', closeModal);

  elements.saveCredentialsBtn.addEventListener('click', () => {
    const newProjectId = elements.projectIdInput ? elements.projectIdInput.value.trim() : '';
    const newKey = elements.apiKeyInput.value.trim();

    state.projectId = newProjectId;
    state.apiKey = newKey;

    localStorage.setItem(STORAGE_KEYS.PROJECT_ID, newProjectId);
    localStorage.setItem(STORAGE_KEYS.API_KEY, newKey);

    updateCredentialsDisplay();
    closeModal();
    checkGatewayHealth();
  });

  elements.toggleApiKeyVisibility.addEventListener('click', () => {
    const isPass = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPass ? 'text' : 'password';
    elements.toggleApiKeyVisibility.textContent = isPass ? '🔒' : '👁️';
  });
}

function updateInputHeight() {
  elements.userInput.style.height = 'auto';
  elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 180) + 'px';
}

function updateInputState() {
  const hasText = elements.userInput.value.trim().length > 0;
  elements.sendBtn.disabled = !hasText || state.isLoading;
  if (hasText) {
    elements.sendBtn.classList.add('active');
  } else {
    elements.sendBtn.classList.remove('active');
  }
}

function updateModelUI() {
  const options = Array.from(elements.modelDropdownMenu.querySelectorAll('.model-option'));
  let activeOpt = options.find((opt) => {
    const p = opt.getAttribute('data-provider') || 'auto';
    const m = opt.getAttribute('data-model') || 'auto';
    return (p === state.selectedProvider && m === state.selectedModel) || (p === 'auto' && state.selectedProvider === 'auto' && state.selectedModel === 'auto');
  });

  if (!activeOpt && state.selectedProvider === 'auto') {
    activeOpt = options[0];
  }

  const title = activeOpt ? activeOpt.querySelector('.opt-title')?.textContent?.trim() || 'OneAPI Auto-Failover' : 'OneAPI Auto-Failover';
  const icon = activeOpt ? activeOpt.querySelector('.opt-icon')?.textContent?.trim() || '⚡' : '⚡';

  elements.currentModelName.textContent = title;
  const iconSpan = elements.modelDropdownBtn.querySelector('.model-icon');
  if (iconSpan) iconSpan.textContent = icon;
  elements.activeEngineChip.textContent = title;

  options.forEach((opt) => {
    const p = opt.getAttribute('data-provider') || 'auto';
    const m = opt.getAttribute('data-model') || 'auto';
    const isSelected =
      (p === state.selectedProvider && m === state.selectedModel) ||
      (p === 'auto' && state.selectedProvider === 'auto' && state.selectedModel === 'auto');
    if (isSelected) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

function updateCredentialsDisplay() {
  if (state.apiKey) {
    const masked = state.apiKey.length > 12 ? `${state.apiKey.slice(0, 8)}...${state.apiKey.slice(-4)}` : 'Key Set';
    elements.sidebarKeyDisplay.textContent = masked;
    elements.sidebarKeyStatus.textContent = '✓ Ready to Proxy';
  } else {
    elements.sidebarKeyDisplay.textContent = 'Set API Key';
    elements.sidebarKeyStatus.textContent = 'Key Required';
  }
}

// =========================================================================
// Markdown & Escape Utilities
// =========================================================================
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatMarkdown(text) {
  if (!text) return '';

  // 1. Code blocks ```lang ... ```
  let formatted = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const l = lang || 'code';
    const escapedCode = escapeHtml(code.trim());
    return `
      <div class="code-block">
        <div class="code-header">
          <span>${l}</span>
          <button class="copy-btn" data-code="${escapeHtml(code.trim())}">Copy</button>
        </div>
        <pre><code>${escapedCode}</code></pre>
      </div>
    `;
  });

  // 2. Inline code `...`
  formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: #2a2a2a; color: #38bdf8; padding: 2px 6px; border-radius: 6px; font-family: var(--font-mono); font-size: 12px;">$1</code>');

  // 3. Bold **...**
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 4. Bullet points
  formatted = formatted.replace(/^\s*[-*]\s+(.*)$/gm, '<li style="margin-left: 20px;">$1</li>');

  // 5. Line breaks
  formatted = formatted.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  return formatted;
}
