import { describe, expect, it } from 'vitest';
import { OnyxError } from '../src/errors/onyx-error';

describe('OnyxError', () => {
  it('sets name and message', () => {
    const err = new OnyxError('boom');
    expect(err.name).toBe('OnyxError');
    expect(err.message).toBe('boom');
  });
});
