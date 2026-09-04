// filename: src/core/msgpack.ts

/** MessagePack media type used by the Onyx entity protocol. */
export const MESSAGEPACK_MEDIA_TYPE = 'application/vnd.msgpack';
export const MESSAGEPACK_ACCEPT = `${MESSAGEPACK_MEDIA_TYPE}, application/json;q=0.9`;

const MAX_NESTING_DEPTH = 128;
const MAX_CONTAINER_LENGTH = 1_000_000;
const MAX_VALUE_COUNT = 2_000_000;
const MAX_STRING_BYTES = 16 * 1024 * 1024;
const MAX_MESSAGE_BYTES = 64 * 1024 * 1024;
const MIN_SIGNED_INT64 = -0x8000000000000000n;
const MAX_SIGNED_INT64 = 0x7fffffffffffffffn;
const MIN_SAFE_INTEGER_BIGINT = BigInt(Number.MIN_SAFE_INTEGER);
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function assertMessageSize(size: number, subject: 'value' | 'payload'): void {
  if (size > MAX_MESSAGE_BYTES) {
    throw new MessagePackError(`MessagePack ${subject} exceeds ${MAX_MESSAGE_BYTES} bytes`);
  }
}

export class MessagePackError extends Error {
  readonly name = 'MessagePackError';

  constructor(
    message: string,
    readonly code: 'invalid' | 'truncated' = 'invalid',
  ) {
    super(message);
  }
}

class ByteWriter {
  private bytes = new Uint8Array(256);
  private view = new DataView(this.bytes.buffer);
  private offset = 0;

  finish(): Uint8Array {
    return this.bytes.slice(0, this.offset);
  }

  writeByte(value: number): void {
    this.reserve(1);
    this.bytes[this.offset++] = value;
  }

  writeBytes(value: Uint8Array): void {
    this.reserve(value.byteLength);
    this.bytes.set(value, this.offset);
    this.offset += value.byteLength;
  }

  writeUint16(value: number): void {
    this.reserve(2);
    this.view.setUint16(this.offset, value);
    this.offset += 2;
  }

  writeUint32(value: number): void {
    this.reserve(4);
    this.view.setUint32(this.offset, value);
    this.offset += 4;
  }

  writeInt8(value: number): void {
    this.reserve(1);
    this.view.setInt8(this.offset, value);
    this.offset += 1;
  }

  writeInt16(value: number): void {
    this.reserve(2);
    this.view.setInt16(this.offset, value);
    this.offset += 2;
  }

  writeInt32(value: number): void {
    this.reserve(4);
    this.view.setInt32(this.offset, value);
    this.offset += 4;
  }

  writeUint64(value: bigint): void {
    this.reserve(8);
    this.view.setBigUint64(this.offset, value);
    this.offset += 8;
  }

  writeInt64(value: bigint): void {
    this.reserve(8);
    this.view.setBigInt64(this.offset, value);
    this.offset += 8;
  }

  writeFloat64(value: number): void {
    this.reserve(8);
    this.view.setFloat64(this.offset, value);
    this.offset += 8;
  }

  private reserve(additional: number): void {
    const required = this.offset + additional;
    assertMessageSize(required, 'value');
    if (required <= this.bytes.byteLength) return;

    let capacity = this.bytes.byteLength;
    while (capacity < required) {
      capacity = Math.min(MAX_MESSAGE_BYTES, capacity * 2);
    }
    const next = new Uint8Array(capacity);
    next.set(this.bytes);
    this.bytes = next;
    this.view = new DataView(next.buffer);
  }
}

class Encoder {
  private readonly writer = new ByteWriter();
  private readonly activeContainers = new WeakSet<object>();
  private valueCount = 0;

  encode(value: unknown): Uint8Array {
    this.writeValue(value, 0);
    return this.writer.finish();
  }

  private countValue(): void {
    this.valueCount += 1;
    if (this.valueCount > MAX_VALUE_COUNT) {
      throw new MessagePackError(`MessagePack value exceeds ${MAX_VALUE_COUNT} items`);
    }
  }

  private writeValue(value: unknown, depth: number): void {
    if (depth > MAX_NESTING_DEPTH) {
      throw new MessagePackError(`MessagePack nesting exceeds ${MAX_NESTING_DEPTH} levels`);
    }
    this.countValue();
    if (value === null) {
      this.writer.writeByte(0xc0);
      return;
    }
    if (typeof value === 'boolean') {
      this.writer.writeByte(value ? 0xc3 : 0xc2);
      return;
    }
    if (typeof value === 'number') {
      this.writeNumber(value);
      return;
    }
    if (typeof value === 'bigint') {
      this.writeBigInt(value);
      return;
    }
    if (typeof value === 'string') {
      this.writeString(value);
      return;
    }
    if (Array.isArray(value)) {
      this.writeArray(value, depth);
      return;
    }
    if (typeof value === 'object') {
      this.writeMap(value as Record<string, unknown>, depth);
      return;
    }
    throw new MessagePackError(`Unsupported MessagePack value: ${typeof value}`);
  }

  private writeNumber(value: number): void {
    if (!Number.isFinite(value)) {
      this.writer.writeByte(0xc0);
      return;
    }
    if (!Number.isInteger(value)) {
      this.writer.writeByte(0xcb);
      this.writer.writeFloat64(value);
      return;
    }
    if (!Number.isSafeInteger(value)) {
      throw new MessagePackError('MessagePack integers must be JavaScript safe integers');
    }
    if (value >= 0) {
      if (value <= 0x7f) {
        this.writer.writeByte(value);
      } else if (value <= 0xff) {
        this.writer.writeByte(0xcc);
        this.writer.writeByte(value);
      } else if (value <= 0xffff) {
        this.writer.writeByte(0xcd);
        this.writer.writeUint16(value);
      } else if (value <= 0xffffffff) {
        this.writer.writeByte(0xce);
        this.writer.writeUint32(value);
      } else {
        this.writer.writeByte(0xcf);
        this.writer.writeUint64(BigInt(value));
      }
      return;
    }
    if (value >= -32) {
      this.writer.writeByte(0x100 + value);
    } else if (value >= -0x80) {
      this.writer.writeByte(0xd0);
      this.writer.writeInt8(value);
    } else if (value >= -0x8000) {
      this.writer.writeByte(0xd1);
      this.writer.writeInt16(value);
    } else if (value >= -0x80000000) {
      this.writer.writeByte(0xd2);
      this.writer.writeInt32(value);
    } else {
      this.writer.writeByte(0xd3);
      this.writer.writeInt64(BigInt(value));
    }
  }

  private writeBigInt(value: bigint): void {
    if (value < MIN_SIGNED_INT64 || value > MAX_SIGNED_INT64) {
      throw new MessagePackError('MessagePack integers must fit in a signed 64-bit value');
    }
    if (value >= MIN_SAFE_INTEGER_BIGINT && value <= MAX_SAFE_INTEGER_BIGINT) {
      this.writeNumber(Number(value));
      return;
    }
    if (value >= 0n) {
      this.writer.writeByte(0xcf);
      this.writer.writeUint64(value);
    } else {
      this.writer.writeByte(0xd3);
      this.writer.writeInt64(value);
    }
  }

  private writeString(value: string): void {
    const bytes = utf8Encoder.encode(value);
    const length = bytes.byteLength;
    if (length > MAX_STRING_BYTES) {
      throw new MessagePackError(`MessagePack string exceeds ${MAX_STRING_BYTES} bytes`);
    }
    if (length <= 31) {
      this.writer.writeByte(0xa0 | length);
    } else if (length <= 0xff) {
      this.writer.writeByte(0xd9);
      this.writer.writeByte(length);
    } else if (length <= 0xffff) {
      this.writer.writeByte(0xda);
      this.writer.writeUint16(length);
    } else {
      this.writer.writeByte(0xdb);
      this.writer.writeUint32(length);
    }
    this.writer.writeBytes(bytes);
  }

  private writeArray(value: unknown[], depth: number): void {
    this.assertContainer(value, value.length);
    this.writeArrayHeader(value.length);
    this.activeContainers.add(value);
    try {
      for (const item of value) {
        if (
          typeof item === 'undefined' ||
          typeof item === 'function' ||
          typeof item === 'symbol'
        ) {
          this.writeValue(null, depth + 1);
        } else {
          this.writeValue(item, depth + 1);
        }
      }
    } finally {
      this.activeContainers.delete(value);
    }
  }

  private writeMap(value: Record<string, unknown>, depth: number): void {
    const prototype = Object.getPrototypeOf(value) as object | null;
    if (prototype !== Object.prototype && prototype !== null) {
      throw new MessagePackError('MessagePack maps must be plain objects');
    }
    const entries = Object.entries(value).filter(([, item]) => {
      const type = typeof item;
      return type !== 'undefined' && type !== 'function' && type !== 'symbol';
    });
    this.assertContainer(value, entries.length);
    this.writeMapHeader(entries.length);
    this.activeContainers.add(value);
    try {
      for (const [key, item] of entries) {
        this.countValue();
        this.writeString(key);
        this.writeValue(item, depth + 1);
      }
    } finally {
      this.activeContainers.delete(value);
    }
  }

  private assertContainer(value: object, length: number): void {
    if (length > MAX_CONTAINER_LENGTH) {
      throw new MessagePackError(`MessagePack container exceeds ${MAX_CONTAINER_LENGTH} items`);
    }
    if (this.activeContainers.has(value)) {
      throw new MessagePackError('MessagePack values cannot contain circular references');
    }
  }

  private writeArrayHeader(length: number): void {
    if (length <= 15) {
      this.writer.writeByte(0x90 | length);
    } else if (length <= 0xffff) {
      this.writer.writeByte(0xdc);
      this.writer.writeUint16(length);
    } else {
      this.writer.writeByte(0xdd);
      this.writer.writeUint32(length);
    }
  }

  private writeMapHeader(length: number): void {
    if (length <= 15) {
      this.writer.writeByte(0x80 | length);
    } else if (length <= 0xffff) {
      this.writer.writeByte(0xde);
      this.writer.writeUint16(length);
    } else {
      this.writer.writeByte(0xdf);
      this.writer.writeUint32(length);
    }
  }
}

class Decoder {
  private readonly view: DataView;
  private offset = 0;
  private valueCount = 0;

  constructor(
    private readonly bytes: Uint8Array,
    enforceTotalLength = true,
  ) {
    if (enforceTotalLength) assertMessageSize(bytes.byteLength, 'payload');
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  decode(): unknown {
    if (this.bytes.byteLength === 0) throw new MessagePackError('MessagePack payload is empty');
    const { value: result } = this.decodePrefix();
    if (this.offset !== this.bytes.byteLength) {
      throw new MessagePackError('MessagePack payload contains trailing data');
    }
    return result;
  }

  decodePrefix(): { value: unknown; bytesRead: number } {
    const value = this.readValue(0);
    return { value, bytesRead: this.offset };
  }

  private readValue(depth: number): unknown {
    if (depth > MAX_NESTING_DEPTH) {
      throw new MessagePackError(`MessagePack nesting exceeds ${MAX_NESTING_DEPTH} levels`);
    }
    this.valueCount += 1;
    if (this.valueCount > MAX_VALUE_COUNT) {
      throw new MessagePackError(`MessagePack payload exceeds ${MAX_VALUE_COUNT} items`);
    }
    const prefix = this.readByte();
    if (prefix <= 0x7f) return prefix;
    if (prefix >= 0xe0) return prefix - 0x100;
    if ((prefix & 0xe0) === 0xa0) return this.readString(prefix & 0x1f);
    if ((prefix & 0xf0) === 0x90) return this.readArray(prefix & 0x0f, depth);
    if ((prefix & 0xf0) === 0x80) return this.readMap(prefix & 0x0f, depth);

    switch (prefix) {
      case 0xc0:
        return null;
      case 0xc2:
        return false;
      case 0xc3:
        return true;
      case 0xca:
        return this.assertFinite(this.readFloat32());
      case 0xcb:
        return this.assertFinite(this.readFloat64());
      case 0xcc:
        return this.readByte();
      case 0xcd:
        return this.readUint16();
      case 0xce:
        return this.readUint32();
      case 0xcf:
        return this.decodeInteger(this.readUint64(), true);
      case 0xd0:
        return this.readInt8();
      case 0xd1:
        return this.readInt16();
      case 0xd2:
        return this.readInt32();
      case 0xd3:
        return this.decodeInteger(this.readInt64(), false);
      case 0xd9:
        return this.readString(this.readByte());
      case 0xda:
        return this.readString(this.readUint16());
      case 0xdb:
        return this.readString(this.readUint32());
      case 0xdc:
        return this.readArray(this.readUint16(), depth);
      case 0xdd:
        return this.readArray(this.readUint32(), depth);
      case 0xde:
        return this.readMap(this.readUint16(), depth);
      case 0xdf:
        return this.readMap(this.readUint32(), depth);
      case 0xc1:
        throw new MessagePackError('MessagePack payload contains the reserved 0xc1 marker');
      case 0xc4:
      case 0xc5:
      case 0xc6:
        throw new MessagePackError('MessagePack binary values are not supported');
      case 0xc7:
      case 0xc8:
      case 0xc9:
      case 0xd4:
      case 0xd5:
      case 0xd6:
      case 0xd7:
      case 0xd8:
        throw new MessagePackError('MessagePack extension values are not supported');
      // Every possible byte marker is handled above.
      /* istanbul ignore next */
      /* v8 ignore next 2 */
      default:
        throw new MessagePackError(`Unsupported MessagePack marker 0x${prefix.toString(16)}`);
    }
  }

  private readArray(length: number, depth: number): unknown[] {
    this.assertContainer(length);
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      result.push(this.readValue(depth + 1));
    }
    return result;
  }

  private readMap(length: number, depth: number): Record<string, unknown> {
    this.assertContainer(length);
    const result: Record<string, unknown> = {};
    const keys = new Set<string>();
    for (let index = 0; index < length; index += 1) {
      const key = this.readValue(depth + 1);
      if (typeof key !== 'string') {
        throw new MessagePackError('MessagePack map keys must be strings');
      }
      if (keys.has(key)) {
        throw new MessagePackError(`MessagePack map contains duplicate key: ${key}`);
      }
      keys.add(key);
      const value = this.readValue(depth + 1);
      if (key === '__proto__') {
        Object.defineProperty(result, key, {
          value,
          enumerable: true,
          configurable: true,
          writable: true,
        });
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private assertContainer(length: number): void {
    if (length > MAX_CONTAINER_LENGTH) {
      throw new MessagePackError(`MessagePack container exceeds ${MAX_CONTAINER_LENGTH} items`);
    }
  }

  private readString(length: number): string {
    if (length > MAX_STRING_BYTES) {
      throw new MessagePackError(`MessagePack string exceeds ${MAX_STRING_BYTES} bytes`);
    }
    const bytes = this.readBytes(length);
    try {
      return utf8Decoder.decode(bytes);
    } catch {
      throw new MessagePackError('MessagePack string contains invalid UTF-8');
    }
  }

  private assertFinite(value: number): number {
    if (!Number.isFinite(value)) {
      throw new MessagePackError('MessagePack numbers must be finite');
    }
    return value;
  }

  private decodeInteger(value: bigint, unsigned: boolean): number | bigint {
    if (unsigned && value > MAX_SIGNED_INT64) {
      throw new MessagePackError('MessagePack integers must fit in a signed 64-bit value');
    }
    return value >= MIN_SAFE_INTEGER_BIGINT && value <= MAX_SAFE_INTEGER_BIGINT
      ? Number(value)
      : value;
  }

  private readByte(): number {
    this.ensureAvailable(1);
    return this.bytes[this.offset++];
  }

  private readBytes(length: number): Uint8Array {
    this.ensureAvailable(length);
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  private readUint16(): number {
    this.ensureAvailable(2);
    const value = this.view.getUint16(this.offset);
    this.offset += 2;
    return value;
  }

  private readUint32(): number {
    this.ensureAvailable(4);
    const value = this.view.getUint32(this.offset);
    this.offset += 4;
    return value;
  }

  private readUint64(): bigint {
    this.ensureAvailable(8);
    const value = this.view.getBigUint64(this.offset);
    this.offset += 8;
    return value;
  }

  private readInt8(): number {
    this.ensureAvailable(1);
    const value = this.view.getInt8(this.offset);
    this.offset += 1;
    return value;
  }

  private readInt16(): number {
    this.ensureAvailable(2);
    const value = this.view.getInt16(this.offset);
    this.offset += 2;
    return value;
  }

  private readInt32(): number {
    this.ensureAvailable(4);
    const value = this.view.getInt32(this.offset);
    this.offset += 4;
    return value;
  }

  private readInt64(): bigint {
    this.ensureAvailable(8);
    const value = this.view.getBigInt64(this.offset);
    this.offset += 8;
    return value;
  }

  private readFloat32(): number {
    this.ensureAvailable(4);
    const value = this.view.getFloat32(this.offset);
    this.offset += 4;
    return value;
  }

  private readFloat64(): number {
    this.ensureAvailable(8);
    const value = this.view.getFloat64(this.offset);
    this.offset += 8;
    return value;
  }

  private ensureAvailable(length: number): void {
    assertMessageSize(this.offset + length, 'value');
    if (this.offset + length > this.bytes.byteLength) {
      throw new MessagePackError('MessagePack payload is truncated', 'truncated');
    }
  }
}

/** Encodes one complete JSON-compatible value as MessagePack. */
export function encodeMessagePack(value: unknown): Uint8Array {
  return new Encoder().encode(value);
}

/** Decodes one complete MessagePack value and rejects trailing bytes. */
export function decodeMessagePack(bytes: Uint8Array): unknown {
  return new Decoder(bytes).decode();
}

/** Decodes the first value in a buffer for concatenated MessagePack streams. */
export function decodeMessagePackPrefix(
  bytes: Uint8Array,
): { value: unknown; bytesRead: number } {
  return new Decoder(bytes, false).decodePrefix();
}

/** Returns true only for the negotiated Onyx MessagePack media type. */
export function isMessagePackContentType(contentType: string): boolean {
  return contentType.split(';', 1)[0].trim().toLowerCase() === MESSAGEPACK_MEDIA_TYPE;
}
