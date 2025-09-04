// filename: src/errors/http-error.ts
export class OnyxHttpError extends Error {
  readonly name = 'OnyxHttpError';
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;
  readonly rawBody: string;

  constructor(message: string, status: number, statusText: string, body: unknown, rawBody: string) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
    this.rawBody = rawBody;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusText: this.statusText,
      body: this.body,
      rawBody: this.rawBody,
      stack: this.stack,
    };
  }

  [Symbol.for('nodejs.util.inspect.custom')](): Record<string, unknown> {
    return this.toJSON();
  }
}