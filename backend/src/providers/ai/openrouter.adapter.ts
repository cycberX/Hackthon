import type { IProviderAdapter, UnifiedAiRequest, UnifiedAiResponse, ProviderConfig } from '../types.js';

export class OpenRouterAiAdapter implements IProviderAdapter<UnifiedAiRequest, UnifiedAiResponse> {
  public readonly id = 'openrouter';
  public readonly category = 'ai' as const;
  public readonly displayName = 'OpenRouter (Unified AI Models)';
  public readonly isKeyRequired = true;
  public readonly defaultModel = 'meta-llama/llama-3.3-70b-instruct';
  public readonly supportedModels = [
    'meta-llama/llama-3.3-70b-instruct',
    'google/gemini-2.5-flash',
    'deepseek/deepseek-chat',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/gpt-4o-mini',
  ];

  public async execute(params: UnifiedAiRequest, config: ProviderConfig): Promise<UnifiedAiResponse> {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    const model = params.model && params.model !== 'default' && params.model !== 'auto'
      ? params.model
      : (config.metadata?.model || this.defaultModel);

    if (!apiKey) {
      const err = new Error('OpenRouter API key is required. Please add your OpenRouter API key to the project vault or set OPENROUTER_API_KEY.');
      (err as any).statusCode = 401;
      throw err;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 25000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://oneapi.dev',
          'X-Title': 'OneAPI Gateway',
        },
        body: JSON.stringify({
          model,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`OpenRouter upstream error: ${response.status} - ${errorText}`);
        (err as any).statusCode = response.status;
        throw err;
      }

      const data = (await response.json()) as any;
      const promptTokens = data.usage?.prompt_tokens ?? 0;
      const completionTokens = data.usage?.completion_tokens ?? 0;
      const totalTokens = data.usage?.total_tokens ?? (promptTokens + completionTokens);

      return {
        id: data.id || `chatcmpl-openrouter-${Date.now()}`,
        object: data.object || 'chat.completion',
        created: data.created || Math.floor(Date.now() / 1000),
        choices: (data.choices || []).map((c: any) => {
          const finish = c.finish_reason || 'stop';
          return {
            index: c.index ?? 0,
            message: {
              role: c.message?.role || 'assistant',
              content: c.message?.content || '',
            },
            finishReason: finish,
            finish_reason: finish,
          };
        }),
        model: data.model || model,
        provider: this.id,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
