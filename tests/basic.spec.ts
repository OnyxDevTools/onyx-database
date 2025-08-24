import { describe, it, expect } from 'vitest';
import { onyx } from '../src';

describe('basic', () => {
  it('exports init function', () => {
    expect(typeof onyx.init).toBe('function');
  });
});
