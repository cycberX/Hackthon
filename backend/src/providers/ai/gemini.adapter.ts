import type { IProviderAdapter, UnifiedAiRequest, UnifiedAiResponse, ProviderConfig } from '../types.js';

export class GeminiAiAdapter implements IProviderAdapter<UnifiedAiRequest, UnifiedAiResponse> {
  public readonly id = 'gemini';
  public readonly category = 'ai' as const;
  public readonly displayName = 'Google Gemini (Multimodal)';
  public readonly isKeyRequired = true;
  public readonly defaultModel = 'gemini-2.5-flash';
  public readonly supportedModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-3.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-3-flash',
    'gemini-3-pro',
  ];

  public async execute(params: UnifiedAiRequest, config: ProviderConfig): Promise<UnifiedAiResponse> {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const err = new Error('Gemini API key is required. Please add it to your project vault.');
      (err as any).statusCode = 401;
      throw err;
    }

    // Convert messages to Gemini contents format
    const contents = params.messages.map((m) => ({
      role: m.role === 'assistant' || (m.role as string) === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Dynamic model candidates (prioritize selected model, then standard reliable fallbacks)
    const userModel = params.model && params.model !== 'default' && params.model !== 'auto'
      ? params.model
      : (config.metadata?.model || this.defaultModel);

    const fallbackCandidates = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    const modelCandidates = Array.from(new Set([userModel, ...fallbackCandidates]));

    let lastError: Error | null = null;

    for (const model of modelCandidates) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs || 25000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: params.temperature ?? 0.7,
              maxOutputTokens: params.maxTokens ?? 1024,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`Gemini upstream error (${model}): ${response.status} - ${errorText}`);
          (error as any).statusCode = response.status;
          lastError = error;
          // If model deprecated (404) or busy (503), try next candidate
          if (response.status === 404 || response.status === 503) {
            continue;
          }
          throw error;
        }

        const data = (await response.json()) as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const rawFinish = data.candidates?.[0]?.finishReason || 'STOP';
        const finishReason = rawFinish.toLowerCase() === 'stop' ? 'stop' : rawFinish.toLowerCase();

        const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
        const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
        const totalTokens = data.usageMetadata?.totalTokenCount ?? (promptTokens + completionTokens);

        return {
          id: `chatcmpl-gemini-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: text,
              },
              finishReason,
              finish_reason: finishReason,
            },
          ],
          model,
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
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError' || err.statusCode === 404 || err.statusCode === 503) {
          continue;
        }
        throw err;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error('Gemini failed to generate content with all candidate models.');
  }
}
