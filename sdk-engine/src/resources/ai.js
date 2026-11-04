import { ChatResponse } from './chat-response.js';

export class AIResource {
  constructor(client) {
    this.client = client;
  }

  /**
   * Execute chat completion with automated priority cascade failover
   * across Gemini -> Groq -> OpenRouter.
   *
   * @param {Object} options
   * @param {Array<{role: string, content: string}>} [options.messages]
   * @param {string} [options.prompt] Convenience string shorthand
   * @param {string} [options.model] Specific model or 'default'
   * @param {number} [options.temperature] Sampling temperature (0.0 - 2.0)
   * @param {number} [options.maxTokens] Maximum tokens to generate
   * @param {string} [options.provider] Target a specific provider ('gemini' | 'groq' | 'openrouter')
   * @returns {Promise<ChatResponse>}
   */
  async chat({
    messages,
    prompt,
    model = 'default',
    temperature = 0.7,
    maxTokens,
    provider,
  } = {}) {
    let effectiveMessages = messages;
    if (!effectiveMessages && prompt) {
      effectiveMessages = [{ role: 'user', content: String(prompt) }];
    }

    if (!Array.isArray(effectiveMessages) || effectiveMessages.length === 0) {
      throw new Error('At least one chat message is required (pass messages array or prompt string)');
    }

    const headers = {};
    if (provider) {
      headers['x-oneapi-provider'] = provider;
    }

    const data = await this.client.request('/proxy/ai/chat', {
      method: 'POST',
      headers,
      body: {
        model,
        messages: effectiveMessages,
        temperature,
        ...(maxTokens !== undefined && { maxTokens }),
        ...(provider && { provider }),
      },
    });

    return new ChatResponse(data);
  }

  /**
   * Upload Document / File into OneAPI Vault for AI Assistants
   *
   * @param {Object} options
   * @param {string|Buffer} options.file Text content or file buffer
   * @param {string} [options.filename] Name of the file
   * @param {string} [options.purpose='assistants']
   * @returns {Promise<Object>}
   */
  async upload_file({ file, purpose = 'assistants', filename } = {}) {
    if (!file) {
      throw new Error('File buffer or text content is required');
    }

    const data = await this.client.request('/proxy/ai/upload', {
      method: 'POST',
      body: {
        file: typeof file === 'string' ? file : file.toString('base64'),
        purpose,
        filename: filename || `upload_${Date.now()}.txt`,
      },
    });

    return data.data || data;
  }
}
