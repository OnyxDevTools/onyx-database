// filename: src/errors/http-error.ts
export class OnyxHttpError extends Error {
  readonly name = 'OnyxHttpError';
  readonly status: number;
  readonly statusText: string;
  readonly body: unknown;

  constructor(message: string, status: number, statusText: string, body: unknown) {
    super(message);
    this.status = status;
    this.statusText = statusText;
    this.body = body;
  }
}