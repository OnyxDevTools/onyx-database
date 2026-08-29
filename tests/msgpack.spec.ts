// filename: tests/msgpack.spec.ts
import { describe, expect, it } from 'vitest';
import goldenVectors from './fixtures/msgpack-golden.json';
import {
  decodeMessagePack,
  decodeMessagePackPrefix,
  encodeMessagePack,
  isMessagePackContentType,
  MessagePackError,
} from '../src/core/msgpack';

function fromHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? []);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('MessagePack golden vectors', () => {
  for (const vector of goldenVectors) {
    it(`encodes and decodes ${vector.name}`, () => {
      expect(toHex(encodeMessagePack(vector.value))).toBe(vector.hex);
      expect(decodeMessagePack(fromHex(vector.hex))).toEqual(vector.value);
    });
  }
});

describe('MessagePack recursive values', () => {
  it('round-trips nested entity and query shapes', () => {
    const value = {
      id: 42,
      created: '2026-08-29T12:34:56.789Z',
      score: 0.875,
      active: true,
      profile: {
        displayName: 'Ada 🚀',
        aliases: ['a', null, 'b'],
      },
      conditions: {
        conditionType: 'AndCondition',
        conditions: [
          {
            conditionType: 'SingleCondition',
            criteria: { field: 'age', operator: 'GREATER_THAN', value: 21 },
          },
        ],
      },
    };
    expect(decodeMessagePack(encodeMessagePack(value))).toEqual(value);
  });

  it('handles all supported integer widths and container headers', () => {
    const value = {
      integers: [
        Number.MIN_SAFE_INTEGER,
        -0x80000001,
        -0x80000000,
        -0x8001,
        -0x8000,
        -0x81,
        -0x80,
        -33,
        -32,
        0,
        127,
        128,
        255,
        256,
        65535,
        65536,
        0xffffffff,
        0x100000000,
        Number.MAX_SAFE_INTEGER,
      ],
      longString: 'x'.repeat(70_000),
      longArray: Array.from({ length: 20 }, (_, index) => index),
      longMap: Object.fromEntries(Array.from({ length: 20 }, (_, index) => [`k${index}`, index])),
    };
    expect(decodeMessagePack(encodeMessagePack(value))).toEqual(value);
  });

  it('handles str8, str16, array32, map16, and map32 headers', () => {
    const str8 = 'x'.repeat(32);
    const str16 = 'y'.repeat(256);
    expect(decodeMessagePack(encodeMessagePack(str8))).toBe(str8);
    expect(decodeMessagePack(encodeMessagePack(str16))).toBe(str16);

    const array32 = Array.from({ length: 65_536 }, (_, index) => index % 128);
    expect(decodeMessagePack(encodeMessagePack(array32))).toEqual(array32);

    const map16 = Object.fromEntries(
      Array.from({ length: 16 }, (_, index) => [`m${index}`, index]),
    );
    expect(decodeMessagePack(encodeMessagePack(map16))).toEqual(map16);

    const map32 = Object.fromEntries(
      Array.from({ length: 65_536 }, (_, index) => [`k${index}`, index % 128]),
    );
    expect(decodeMessagePack(encodeMessagePack(map32))).toEqual(map32);
  });

  it('decodes standards-compliant float32 values', () => {
    expect(decodeMessagePack(fromHex('ca3fc00000'))).toBe(1.5);
  });

  it('round-trips the complete signed int64 range losslessly with bigint', () => {
    const values = [
      -0x8000000000000000n,
      -0x20000000000000n,
      0x20000000000000n,
      0x7fffffffffffffffn,
    ];
    for (const value of values) {
      expect(decodeMessagePack(encodeMessagePack(value))).toBe(value);
    }

    expect(toHex(encodeMessagePack(-0x8000000000000000n))).toBe('d38000000000000000');
    expect(toHex(encodeMessagePack(0x7fffffffffffffffn))).toBe('cf7fffffffffffffff');
    expect(decodeMessagePack(encodeMessagePack(42n))).toBe(42);
    expect(decodeMessagePack(fromHex('cf0020000000000000'))).toBe(0x20000000000000n);
    expect(decodeMessagePack(fromHex('d3ffe0000000000000'))).toBe(-0x20000000000000n);
  });

  it('preserves an own __proto__ map property without prototype mutation', () => {
    const bytes = fromHex('81a95f5f70726f746f5f5f81a8706f6c6c75746564c3');
    const result = decodeMessagePack(bytes) as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(true);
    expect(result.__proto__).toEqual({ polluted: true });
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });

  it('accepts null-prototype maps', () => {
    const value = Object.create(null) as Record<string, unknown>;
    value.id = 1;
    expect(decodeMessagePack(encodeMessagePack(value))).toEqual({ id: 1 });
  });

  it('decodes one prefix while leaving concatenated frames to the caller', () => {
    const frame = decodeMessagePackPrefix(fromHex('c001'));
    expect(frame).toEqual({ value: null, bytesRead: 1 });
  });
});

describe('MessagePack validation', () => {
  it.each([
    ['truncated value', 'cd01'],
    ['trailing value', 'c0c0'],
    ['reserved marker', 'c1'],
    ['binary value', 'c40100'],
    ['extension value', 'd40000'],
    ['non-string map key', '8101c0'],
    ['duplicate map key', '82a16101a16102'],
    ['invalid UTF-8', 'a1ff'],
    ['non-finite number', 'cb7ff0000000000000'],
    ['uint64 above signed int64 range', 'cf8000000000000000'],
    ['non-finite float32', 'ca7f800000'],
  ])('rejects %s', (_name, hex) => {
    expect(() => decodeMessagePack(fromHex(hex))).toThrow(MessagePackError);
  });

  it.each(['c4', 'c5', 'c6'])('rejects binary marker %s', (hex) => {
    expect(() => decodeMessagePack(fromHex(hex))).toThrow(/binary values/);
  });

  it.each(['c7', 'c8', 'c9', 'd4', 'd5', 'd6', 'd7', 'd8'])(
    'rejects extension marker %s',
    (hex) => {
      expect(() => decodeMessagePack(fromHex(hex))).toThrow(/extension values/);
    },
  );

  it('rejects empty payloads and declared values above protocol limits', () => {
    expect(() => decodeMessagePack(new Uint8Array(0))).toThrow(/empty/);
    const oversized = { byteLength: 64 * 1024 * 1024 + 1 } as Uint8Array;
    expect(() => decodeMessagePack(oversized)).toThrow(/payload exceeds/);
    expect(() => decodeMessagePack(fromHex('dd000f4241'))).toThrow(/container exceeds/);
    expect(() => decodeMessagePack(fromHex('db01000001'))).toThrow(/string exceeds/);
  });

  it('enforces encoder container and string limits', () => {
    expect(() => encodeMessagePack(new Array(1_000_001))).toThrow(/container exceeds/);
    expect(() => encodeMessagePack('x'.repeat(16 * 1024 * 1024 + 1))).toThrow(/string exceeds/);
  });

  it('enforces the total node limit while encoding and decoding', () => {
    const repeated = new Array<unknown>(1_000_000).fill([null]);
    expect(() => encodeMessagePack(repeated)).toThrow(/exceeds 2000000 items/);

    const encoded = new Uint8Array(5 + 2_000_000);
    encoded.set(fromHex('dd000f4240'));
    for (let offset = 5; offset < encoded.length; offset += 2) {
      encoded[offset] = 0x91;
      encoded[offset + 1] = 0xc0;
    }
    expect(() => decodeMessagePack(encoded)).toThrow(/exceeds 2000000 items/);
  });

  it('rejects unsupported or out-of-range encoder inputs', () => {
    expect(() => encodeMessagePack(undefined)).toThrow(MessagePackError);
    expect(() => encodeMessagePack(2 ** 53)).toThrow(MessagePackError);
    expect(() => encodeMessagePack(-0x8000000000000001n)).toThrow(/signed 64-bit/);
    expect(() => encodeMessagePack(0x8000000000000000n)).toThrow(/signed 64-bit/);
    expect(() => encodeMessagePack(new Uint8Array([1]))).toThrow(MessagePackError);
    expect(() => encodeMessagePack(new Date())).toThrow(MessagePackError);
  });

  it('matches JSON normalization for undefined and non-finite nested values', () => {
    const value = {
      omitted: undefined,
      omittedFunction: () => undefined,
      omittedSymbol: Symbol('omitted'),
      values: [undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY],
    };
    expect(decodeMessagePack(encodeMessagePack(value))).toEqual({
      values: [null, null, null, null],
    });
    expect(decodeMessagePack(encodeMessagePack(Number.NaN))).toBeNull();
  });

  it('rejects circular and overly nested containers', () => {
    const circular: unknown[] = [];
    circular.push(circular);
    expect(() => encodeMessagePack(circular)).toThrow(/circular/);

    let nested: unknown = null;
    for (let index = 0; index < 129; index += 1) nested = [nested];
    expect(() => encodeMessagePack(nested)).toThrow(/nesting/);

    const nestedBytes = new Uint8Array(130);
    nestedBytes.fill(0x91, 0, 129);
    nestedBytes[129] = 0xc0;
    expect(() => decodeMessagePack(nestedBytes)).toThrow(/nesting/);
  });

  it('allows depth 128 and rejects values beyond it', () => {
    let allowed: unknown = [];
    for (let depth = 0; depth < 128; depth += 1) allowed = [allowed];
    expect(() => encodeMessagePack(allowed)).not.toThrow();

    const allowedBytes = new Uint8Array(129);
    allowedBytes.fill(0x91, 0, 128);
    allowedBytes[128] = 0x90;
    expect(() => decodeMessagePack(allowedBytes)).not.toThrow();

    expect(() => encodeMessagePack([allowed])).toThrow(/nesting/);
    const rejectedBytes = new Uint8Array(130);
    rejectedBytes.fill(0x91, 0, 129);
    rejectedBytes[129] = 0x90;
    expect(() => decodeMessagePack(rejectedBytes)).toThrow(/nesting/);
  });
});

describe('MessagePack media type', () => {
  it('matches the vendor media type and optional parameters only', () => {
    expect(isMessagePackContentType('application/vnd.msgpack')).toBe(true);
    expect(isMessagePackContentType('Application/Vnd.MsgPack; version=1')).toBe(true);
    expect(isMessagePackContentType('application/json')).toBe(false);
    expect(isMessagePackContentType('application/msgpack')).toBe(false);
  });
});
