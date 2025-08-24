// filename: src/errors/onyx-error.ts
export class OnyxError extends Error {
  readonly name = 'OnyxError';
  constructor(message: string) {
    super(message);
  }
}
