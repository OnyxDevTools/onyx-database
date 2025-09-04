// filename: src/core/http.ts
import { OnyxHttpError } from '../errors/http-error';
import { OnyxConfigError } from '../errors/config-error';
import type { FetchImpl } from '../types/common';

export function parseJsonAllowNaN(txt: string): unknown {
  try {
    return JSON.parse(txt);
  } catch {
    const fixed = txt.replace(/(:\s*)(NaN|Infinity|-Infinity)(\s*[,}])/g, '$1null$3');
    return JSON.parse(fixed);
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
  fetchImpl?: FetchImpl;
  defaultHeaders?: Record<string, string>;
  requestLoggingEnabled?: boolean;
  responseLoggingEnabled?: boolean;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly fetchImpl: FetchImpl;
  private readonly defaults: Record<string, string>;
  private readonly requestLoggingEnabled: boolean;
  private readonly responseLoggingEnabled: boolean;

  constructor(opts: HttpClientOptions) {
    if (!opts.baseUrl || opts.baseUrl.trim() === '') {
      throw new OnyxConfigError('baseUrl is required');
    }
    try {
      // ensure baseUrl has protocol; URL constructor will throw otherwise
      new URL(opts.baseUrl);
    } catch {
      throw new OnyxConfigError('baseUrl must include protocol, e.g. https://');
    }
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.apiKey = opts.apiKey;
    this.apiSecret = opts.apiSecret;
    const gfetch = (globalThis as { fetch?: FetchImpl }).fetch;
    if (opts.fetchImpl) {
      this.fetchImpl = opts.fetchImpl;
    } else if (typeof gfetch === 'function') {
      this.fetchImpl = (url, init) => gfetch(url, init);
    } else {
      throw new Error('global fetch is not available; provide OnyxConfig.fetch');
    }
    this.defaults = Object.assign({}, opts.defaultHeaders);
    this.requestLoggingEnabled = !!opts.requestLoggingEnabled;
    this.responseLoggingEnabled = !!opts.responseLoggingEnabled;
  }

  headers(extra?: Record<string, string>): Record<string, string> {
    const extras = { ...(extra ?? {}) };
    delete extras['x-onyx-key'];
    delete extras['x-onyx-secret'];
    return {
      'x-onyx-key': this.apiKey,
      'x-onyx-secret': this.apiSecret,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...this.defaults,
      ...extras,
    };
  }

  async request<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    if (!path.startsWith('/')) {
      throw new OnyxConfigError('path must start with /');
    }
    const url = `${this.baseUrl}${path}`;
    if (this.requestLoggingEnabled) {
      console.log(`${method} ${url}`);
      if (body != null) {
        const logBody = typeof body === 'string' ? body : JSON.stringify(body);
        console.log(logBody);
      }
    }
    const headers = this.headers({
      ...(method === 'DELETE' ? { Prefer: 'return=representation' } : {}),
      ...(extraHeaders ?? {}),
    });
    if (body == null) delete headers['Content-Type'];
    const payload =
      body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
    const init = {
      method,
      headers,
      body: payload,
    };

    const isQuery =
      path.includes('/query/') && !/\/query\/(?:update|delete)\//.test(path);
    const canRetry = method === 'GET' || isQuery;
    const maxAttempts = canRetry ? 3 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const res = await this.fetchImpl(url, init);
        const contentType = res.headers.get('Content-Type') || '';
        const raw = await res.text();
        if (this.responseLoggingEnabled) {
          const statusLine = `${res.status} ${res.statusText}`.trim();
          console.log(statusLine);
          if (raw.trim().length > 0) {
            console.log(raw);
          }
        }
        const isJson =
          raw.trim().length > 0 &&
          (contentType.includes('application/json') || /^[\[{]/.test(raw.trim()));
        const data = isJson ? parseJsonAllowNaN(raw) : raw;
        if (!res.ok) {
          const msg =
            typeof data === 'object' &&
            data !== null &&
            'error' in data &&
            typeof (data as { error?: { message?: unknown } }).error?.message === 'string'
              ? String((data as { error: { message: unknown } }).error.message)
              : `${res.status} ${res.statusText}`;
          if (canRetry && res.status >= 500 && attempt + 1 < maxAttempts) {
            await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
            continue;
          }
          throw new OnyxHttpError(msg, res.status, res.statusText, data, raw);
        }
        return data as T;
      } catch (err) {
        const retryable =
          canRetry && (!(err instanceof OnyxHttpError) || err.status >= 500);
        if (attempt + 1 < maxAttempts && retryable) {
          await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
          continue;
        }
        throw err;
      }
    }
    // unreachable but satisfies TypeScript
    throw new Error('Request failed after retries');
  }
}
