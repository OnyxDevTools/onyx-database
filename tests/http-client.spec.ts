import { describe, it, expect, vi } from 'vitest';
import { HttpClient, parseJsonAllowNaN } from '../src/core/http';

// filename: tests/http-client.spec.ts

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

  it('throws OnyxHttpError on non-ok responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'bad' } }), {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'application/json' }
      })
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('GET', '/oops')).rejects.toMatchObject({
      name: 'OnyxHttpError',
      message: 'bad',
      status: 401,
      statusText: 'Unauthorized',
      body: { error: { message: 'bad' } }
    });
  });

  it('falls back to status text when no error message present', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('nope', {
        status: 500,
        statusText: 'Server Error',
        headers: { 'Content-Type': 'text/plain' }
      })
    );
    const client = new HttpClient({ baseUrl: base, ...creds, fetchImpl: fetchMock });
    await expect(client.request('GET', '/fail')).rejects.toMatchObject({
      message: '500 Server Error',
      status: 500,
      statusText: 'Server Error',
      body: 'nope'
    });
  });
});

