import { describe, it, expect } from 'vitest';
import { OnyxConfigError } from '../src/errors/config-error';

// filename: tests/config-error.spec.ts

describe('OnyxConfigError', () => {
  it('sets name and message', () => {
    const err = new OnyxConfigError('bad');
    expect(err.name).toBe('OnyxConfigError');
    expect(err.message).toBe('bad');
  });
});
