export class ChatResponse {
  constructor(data) {
    const root = data.data || data;

    this.id = root.id || data.id || `chatcmpl_${Date.now()}`;
    this.object = root.object || 'chat.completion';
    this.created = root.created || Math.floor(Date.now() / 1000);
    this.model = root.model || data.model || 'auto';
    this.provider = data._oneapi?.finalProvider || root.provider || data.provider || 'unknown';
    this.primaryProvider = data._oneapi?.primaryProvider || this.provider;
    this.fallbackTriggered = Boolean(data._oneapi?.fallbackTriggered);
    this.fallbackReason = data._oneapi?.fallbackReason || null;
    this.latencyMs = data._oneapi?.latencyMs || root.latencyMs || 0;
    this.choices = root.choices || data.choices || [];
    this.usage = root.usage || data.usage || {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    this.raw = data;
  }

  /**
   * First assistant message content
   */
  get content() {
    return this.choices[0]?.message?.content ?? '';
  }

  /**
   * First assistant message object
   */
  get message() {
    return this.choices[0]?.message ?? null;
  }

  /**
   * First choice finish reason
   */
  get finishReason() {
    return this.choices[0]?.finishReason || this.choices[0]?.finish_reason || 'stop';
  }

  /**
   * Boolean indicating whether OneAPI failover cascade was triggered
   */
  get usedFallback() {
    return this.fallbackTriggered;
  }

  /**
   * Name of provider that successfully executed the request
   */
  get providerUsed() {
    return this.provider;
  }

  /**
   * Full OneAPI telemetry metadata
   */
  get telemetry() {
    return {
      primaryProvider: this.primaryProvider,
      finalProvider: this.provider,
      fallbackTriggered: this.fallbackTriggered,
      fallbackReason: this.fallbackReason,
      latencyMs: this.latencyMs,
    };
  }

  /**
   * Convert response to standard OpenAI format JSON
   */
  toJSON() {
    return {
      id: this.id,
      object: this.object,
      created: this.created,
      model: this.model,
      choices: this.choices,
      usage: this.usage,
      provider: this.provider,
      _oneapi: this.telemetry,
    };
  }
}
