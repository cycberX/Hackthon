export class ChatResponse {
  constructor(data) {
    this.id = data.id;
    this.model = data.model;
    this.provider = data.provider;
    this.fallback = data.fallback;
    this.usage = data.usage;
    this.choices = data.choices || [];
    this.raw = data;
  }

  get content() {
    return this.choices[0]?.message?.content ?? null;
  }

  get usedFallback() {
    return this.fallback?.attempted ?? false;
  }

  get providerUsed() {
    return this.provider ?? null;
  }
}