import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inspect } from 'node:util';
import { HttpClient, parseJsonAllowNaN } from '../src/core/http';
import { OnyxHttpError } from '../src/errors/http-error';
import {
  decodeMessagePack,
  encodeMessagePack,
  MESSAGEPACK_ACCEPT,
  MESSAGEPACK_MEDIA_TYPE,
} from '../src/core/msgpack';
import type { FetchResponse } from '../src/types/common';

// filename: tests/http-client.spec.ts

beforeEach(() => {
  delete process.env.ONYX_DEBUG;
});

describe('parseJsonAllowNaN', () => {
  it('parses valid JSON normally', () => {
    const result = parseJsonAllowNaN('{"a":1}') as Record<string, unknown>;
    expect(result).toEqual({ a: 1 });
  });

  it('replaces NaN and Infinity with null', () => {
    const result = parseJsonAllowNaN('{"a":NaN,"b":Infinity,"c":-Infinity}') as Record<string, unknown>;
    expect(result).toEqual({ a: null, b: null, c: null });
  });
});

describe('HttpClient', () => {
  const base = 'https://api.test';
  const creds = { apiKey: 'k', apiSecret: 's' };

  it('returns default headers without extras', () => {
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: vi.fn() });
    expect(client.headers()).toEqual({
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': creds.apiSecret,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    });
  });

  it('does not allow overriding auth headers', () => {
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: vi.fn() });
    const headers = client.headers({
      'x-onyx-key': 'bad',
      'x-onyx-secret': 'bad',
      'X-Custom': '1',
    });
    expect(headers).toEqual({
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': creds.apiSecret,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Custom': '1',
    });
  });

  it('uses provided fetch and returns parsed JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('POST', '/data', { a: 1 }, { 'X-Custom': 'y' });
    expect(fetchMock).toHaveBeenCalledWith(`${base}/data`, {
      method: 'POST',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Custom': 'y'
      },
      body: JSON.stringify({ a: 1 })
    });
    expect(res).toEqual({ ok: true });
  });

  it('uses MessagePack for entity requests by default', async () => {
    const responseBytes = encodeMessagePack({ id: 7, nested: { active: true } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? MESSAGEPACK_MEDIA_TYPE : null },
      text: vi.fn().mockRejectedValue(new Error('text should not be read')),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    } satisfies FetchResponse);
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
    });

    const result = await client.requestEntity('PUT', '/data/db/User', {
      id: 7,
      created: '2026-08-29T12:00:00.000Z',
    });

    expect(result).toEqual({ id: 7, nested: { active: true } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toEqual({
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': creds.apiSecret,
      Accept: MESSAGEPACK_ACCEPT,
      'Content-Type': MESSAGEPACK_MEDIA_TYPE,
    });
    expect(init.body).toBeInstanceOf(Uint8Array);
    expect(decodeMessagePack(init.body as Uint8Array)).toEqual({
      id: 7,
      created: '2026-08-29T12:00:00.000Z',
    });
  });

  it('uses JSON for entity requests when explicitly configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'json',
    });

    await expect(client.requestEntity('PUT', '/data/db/User', { id: 7 })).resolves.toEqual({
      id: 7,
    });
    expect(fetchMock).toHaveBeenCalledWith(`${base}/data/db/User`, {
      method: 'PUT',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: 7 }),
    });
  });

  it('negotiates MessagePack responses for body-less entity requests', async () => {
    const responseBytes = encodeMessagePack({ id: 1 });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => `${MESSAGEPACK_MEDIA_TYPE}; version=1` },
      text: () => Promise.resolve('unused'),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    } satisfies FetchResponse);
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await expect(client.requestEntity('GET', '/data/db/User/1')).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(`${base}/data/db/User/1`, {
      method: 'GET',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: MESSAGEPACK_ACCEPT,
      },
      body: undefined,
    });
  });

  it('keeps ordinary requests on JSON when MessagePack is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ valid: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await client.request('POST', '/schemas/db/validate', { entities: [] });
    expect(fetchMock).toHaveBeenCalledWith(`${base}/schemas/db/validate`, {
      method: 'POST',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entities: [] }),
    });
  });

  it('accepts JSON fallback and JSON errors for MessagePack entity requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'invalid query' } }), {
          status: 400,
          statusText: 'Bad Request',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await expect(client.requestEntity('GET', '/data/db/User/1')).resolves.toEqual({ id: 1 });
    await expect(
      client.requestEntity('PUT', '/data/db/query/User', { type: 'SelectQuery' }),
    ).rejects.toMatchObject({
      name: 'OnyxHttpError',
      message: 'invalid query',
      body: { error: { message: 'invalid query' } },
    });
  });

  it('decodes MessagePack error responses', async () => {
    const responseBytes = encodeMessagePack({ error: { message: 'binary query error' } });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve('unused'),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    } satisfies FetchResponse);
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await expect(
      client.requestEntity('PUT', '/data/db/query/User', { type: 'SelectQuery' }),
    ).rejects.toMatchObject({
      name: 'OnyxHttpError',
      message: 'binary query error',
      body: { error: { message: 'binary query error' } },
      rawBody: `<MessagePack ${responseBytes.byteLength} bytes>`,
    });
  });

  it('fails clearly when a custom fetch cannot expose MessagePack bytes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve('not binary safe'),
    } satisfies FetchResponse);
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await expect(client.requestEntity('GET', '/data/db/User/1')).rejects.toThrow(
      'MessagePack response requires FetchResponse.arrayBuffer()',
    );
  });

  it('passes through string bodies untouched', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => undefined },
      text: () => Promise.resolve('ok')
    } as unknown as Response);
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await client.request('POST', '/raw', '{"x":1}');
    expect(fetchMock).toHaveBeenCalledWith(`${base}/raw`, {
      method: 'POST',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: '{"x":1}'
    });
  });

  it('logs requests and bodies when requestLoggingEnabled', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
      ),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      requestLoggingEnabled: true,
    });
    await client.request('POST', '/log', { a: 1 });
    await client.request('POST', '/log2', '{"b":2}');
    const hdr = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': '[REDACTED]',
    };
    expect(logSpy).toHaveBeenNthCalledWith(1, `POST ${base}/log`);
    expect(logSpy).toHaveBeenNthCalledWith(2, JSON.stringify({ a: 1 }));
    expect(logSpy).toHaveBeenNthCalledWith(3, 'Headers:', hdr);
    expect(logSpy).toHaveBeenNthCalledWith(4, `POST ${base}/log2`);
    expect(logSpy).toHaveBeenNthCalledWith(5, '{"b":2}');
    expect(logSpy).toHaveBeenNthCalledWith(6, 'Headers:', hdr);
    logSpy.mockRestore();
  });

  it('logs request line without body when enabled and body absent', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } }),
      ),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      requestLoggingEnabled: true,
    });
    await client.request('GET', '/no-body');
    const hdr = {
      Accept: 'application/json',
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': '[REDACTED]',
    };
    expect(logSpy).toHaveBeenNthCalledWith(1, `GET ${base}/no-body`);
    expect(logSpy).toHaveBeenNthCalledWith(2, 'Headers:', hdr);
    expect(logSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });

  it('logs MessagePack bigint request and response values safely', async () => {
    const responseBytes = encodeMessagePack({ id: 0x7fffffffffffffffn, ok: true });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve('unused'),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    } satisfies FetchResponse);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
      requestLoggingEnabled: true,
      responseLoggingEnabled: true,
    });

    await expect(
      client.requestEntity('PUT', '/data/db/User', {
        id: -0x8000000000000000n,
        version: 1,
      }),
    ).resolves.toEqual({ id: 0x7fffffffffffffffn, ok: true });

    expect(logSpy).toHaveBeenNthCalledWith(1, `PUT ${base}/data/db/User`);
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      '{"id":"-9223372036854775808n","version":1}',
    );
    expect(logSpy).toHaveBeenNthCalledWith(3, 'Headers:', {
      Accept: MESSAGEPACK_ACCEPT,
      'Content-Type': MESSAGEPACK_MEDIA_TYPE,
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': '[REDACTED]',
    });
    expect(logSpy).toHaveBeenNthCalledWith(4, '200 OK');
    expect(logSpy).toHaveBeenNthCalledWith(
      5,
      '{"id":"9223372036854775807n","ok":true}',
    );
    expect(
      decodeMessagePack(fetchMock.mock.calls[0][1].body as Uint8Array),
    ).toEqual({ id: -0x8000000000000000n, version: 1 });
    logSpy.mockRestore();
  });

  it('logs responses and bodies when responseLoggingEnabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      responseLoggingEnabled: true,
    });
    await client.request('GET', '/resp');
    expect(logSpy).toHaveBeenNthCalledWith(1, '200 OK');
    expect(logSpy).toHaveBeenNthCalledWith(2, JSON.stringify({ ok: true }));
    logSpy.mockRestore();
  });

  it('logs decoded MessagePack responses without treating bytes as text', async () => {
    const responseBytes = encodeMessagePack({ ok: true });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve('unused'),
      arrayBuffer: () => Promise.resolve(responseBytes.slice().buffer as ArrayBuffer),
    } satisfies FetchResponse);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
      responseLoggingEnabled: true,
    });

    await client.requestEntity('GET', '/data/db/User/1');

    expect(logSpy).toHaveBeenNthCalledWith(1, '200 OK');
    expect(logSpy).toHaveBeenNthCalledWith(2, JSON.stringify({ ok: true }));
    logSpy.mockRestore();
  });

  it('accepts empty MessagePack responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: { get: () => MESSAGEPACK_MEDIA_TYPE },
      text: () => Promise.resolve('unused'),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    } satisfies FetchResponse);
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      wireFormat: 'msgpack',
    });

    await expect(client.requestEntity('DELETE', '/data/db/User/1')).resolves.toBe('');
  });

  it('logs response line without body when enabled and body absent', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({
      baseUrl: base,
      ...creds,
      fetchImpl: fetchMock,
      responseLoggingEnabled: true,
    });
    await client.request('GET', '/no-content');
    expect(logSpy).toHaveBeenCalledWith('204 No Content');
    expect(logSpy).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
  });

  it('logs request and response when ONYX_DEBUG=true without explicit flags', async () => {
    process.env.ONYX_DEBUG = 'true';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await client.request('POST', '/dbg', { a: 1 });
    const hdr = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-onyx-key': creds.apiKey,
      'x-onyx-secret': '[REDACTED]',
    };
    expect(logSpy).toHaveBeenNthCalledWith(1, `POST ${base}/dbg`);
    expect(logSpy).toHaveBeenNthCalledWith(2, JSON.stringify({ a: 1 }));
    expect(logSpy).toHaveBeenNthCalledWith(3, 'Headers:', hdr);
    expect(logSpy).toHaveBeenNthCalledWith(4, '200 OK');
    expect(logSpy).toHaveBeenNthCalledWith(5, JSON.stringify({ ok: true }));
    logSpy.mockRestore();
    delete process.env.ONYX_DEBUG;
  });

  it('omits Content-Type on body-less DELETE and parses JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('DELETE', '/thing');
    expect(fetchMock).toHaveBeenCalledWith(`${base}/thing`, {
      method: 'DELETE',
      headers: {
        'x-onyx-key': creds.apiKey,
        'x-onyx-secret': creds.apiSecret,
        Accept: 'application/json',
        Prefer: 'return=representation'
      },
      body: undefined
    });
    expect(res).toEqual({ ok: true });
  });

  it('parses JSON on DELETE even without content-type header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {}
      })
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('DELETE', '/other');
    expect(res).toEqual({ ok: true });
  });
  it('retries transient server errors and succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('err', {
          status: 524,
          statusText: 'Timeout',
          headers: { 'Content-Type': 'text/plain' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('GET', '/retry');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: true });
  });

  it('retries transient errors on query requests', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('err', {
          status: 500,
          statusText: 'oops',
          headers: { 'Content-Type': 'text/plain' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('PUT', '/query/foo', { x: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: true });
  });

  it('fails after exhausting retries', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response('nope', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('GET', '/fail-retry')).rejects.toMatchObject({ status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retries on fetch rejection and eventually succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('GET', '/retry-net');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: true });
  });

  it('uses exponential backoff for retries', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('net'))
      .mockRejectedValueOnce(new TypeError('net'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const delays: number[] = [];
    const st = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation((fn: any, ms?: number) => {
        delays.push(ms as number);
        fn();
        // @ts-expect-error mock timer
        return 0;
      });
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    const res = await client.request('GET', '/backoff');
    expect(res).toEqual({ ok: true });
    expect(delays).toEqual([100, 200]);
    st.mockRestore();
  });

  it('does not retry write requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('err', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('PUT', '/data/foo', { a: 1 })).rejects.toMatchObject({ status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retry delete requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('err', {
        status: 500,
        statusText: 'Server',
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('DELETE', '/data/foo')).rejects.toMatchObject({ status: 500 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('parses retry-after seconds and date headers', () => {
    const parseRetryAfter = (HttpClient as any).parseRetryAfter as (h: string | null) => number | null;
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter('')).toBeNull();
    expect(parseRetryAfter('   ')).toBeNull();
    expect(parseRetryAfter('3')).toBe(3000);
    const now = Date.now();
    const dateStr = new Date(now + 5000).toUTCString();
    const parsed = parseRetryAfter(dateStr);
    expect(parsed).toBeGreaterThanOrEqual(0);
    expect(parseRetryAfter('not-a-date')).toBeNull();
  });

  it('uses global fetch when none provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('pong', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    );
    const original = globalThis.fetch;
    (globalThis as any).fetch = fetchMock;
    const client = new HttpClient({ baseUrl: base, ...creds });
    const res = await client.request('GET', '/ping');
    expect(fetchMock).toHaveBeenCalled();
    expect(res).toBe('pong');
    (globalThis as any).fetch = original;
  });

  it('throws when no fetch implementation is available', () => {
    const original = globalThis.fetch;
      // @ts-expect-error - simulate missing global fetch
    delete (globalThis as any).fetch;
    expect(() => new HttpClient({ baseUrl: base, ...creds })).toThrow(
      'global fetch is not available; provide OnyxConfig.fetch'
    );
    (globalThis as any).fetch = original;
  });

  it('throws on empty baseUrl', () => {
    expect(() => new HttpClient({ baseUrl: '', ...creds, fetchImpl: vi.fn() })).toThrow(
      'baseUrl is required'
    );
  });

  it('rejects an invalid wire format provided at runtime', () => {
    expect(
      () =>
        new HttpClient({
          baseUrl: base,
          ...creds,
          fetchImpl: vi.fn(),
          wireFormat: 'cbor',
        } as unknown as ConstructorParameters<typeof HttpClient>[0]),
    ).toThrow('wireFormat must be either json or msgpack');
  });

  it('throws when baseUrl lacks protocol', () => {
    expect(() =>
      new HttpClient({ baseUrl: 'api.test', ...creds, fetchImpl: vi.fn() })
    ).toThrow('baseUrl must include protocol');
  });

  it('rejects request paths without leading slash', async () => {
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: vi.fn() });
    await expect(client.request('GET', 'oops')).rejects.toThrow(
      'path must start with /'
    );
  });

  it('throws OnyxHttpError on non-ok responses', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ error: { message: 'bad' } }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' }
        }),
      ),
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('GET', '/oops')).rejects.toMatchObject({
      name: 'OnyxHttpError',
      message: 'bad',
      status: 401,
      statusText: 'Unauthorized',
      body: { error: { message: 'bad' } },
      rawBody: JSON.stringify({ error: { message: 'bad' } })
    });
  });

  it('falls back to status text when no error message present', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response('nope', {
          status: 500,
          statusText: 'Server Error',
          headers: { 'Content-Type': 'text/plain' }
        }),
      ),
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('GET', '/fail')).rejects.toMatchObject({
      message: '500 Server Error',
      status: 500,
      statusText: 'Server Error',
      body: 'nope',
      rawBody: 'nope'
    });
  });

  it('rejects invalid HTTP methods at compile time', () => {
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: vi.fn() });
    // @ts-expect-error - invalid method should not be allowed
    const call = () => client.request('TRACE', '/bad');
    expect(call).toBeDefined();
  });

  it('serializes and inspects OnyxHttpError with raw body', () => {
    const err = new OnyxHttpError('msg', 418, 'I\'m a teapot', { a: 1 }, '{"a":1}');
    expect(err.toJSON()).toMatchObject({
      name: 'OnyxHttpError',
      status: 418,
      statusText: 'I\'m a teapot',
      body: { a: 1 },
      rawBody: '{"a":1}'
    });
    const out = inspect(err);
    expect(out).toContain('rawBody');
  });
});
