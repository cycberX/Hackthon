export class OneAPIError extends Error {
  constructor(message, options = {}) {
    super(message);

    this.name = "OneAPIError";
    this.statusCode = options.statusCode ?? null;
    this.code = options.code ?? "ONEAPI_ERROR";
    this.requestId = options.requestId ?? null;
    this.provider = options.provider ?? null;
  }
}
