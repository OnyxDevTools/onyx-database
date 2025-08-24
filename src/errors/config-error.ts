// filename: src/errors/config-error.ts
export class OnyxConfigError extends Error {
  readonly name = 'OnyxConfigError';
  constructor(message: string) {
    super(message);
  }
}