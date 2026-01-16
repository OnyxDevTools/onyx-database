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
  retryEnabled?: boolean;
  maxRetries?: number;
  retryInitialDelayMs?: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly fetchImpl: FetchImpl;
  private readonly defaults: Record<string, string>;
  private readonly requestLoggingEnabled: boolean;
  private readonly responseLoggingEnabled: boolean;
  private readonly retryEnabled: boolean;
  private readonly maxRetries: number;
  private readonly retryInitialDelayMs: number;

  private static fibonacci(n: number): number {
    if (n <= 1) return 1;
    let a = 1;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      const next = a + b;
      a = b;
      b = next;
    }
    return b;
  }

  private static parseRetryAfter(header: string | null): number | null {
    if (!header) return null;
    const trimmed = header.trim();
    if (trimmed === '') return null;
    const seconds = Number(trimmed);
    if (Number.isFinite(seconds)) {
      return Math.max(0, seconds * 1000);
    }
    const dateMs = Date.parse(trimmed);
    if (!Number.isNaN(dateMs)) {
      const now = Date.now();
      return Math.max(0, dateMs - now);
    }
    return null;
  }

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
    const envDebug =
      (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
        ?.env?.ONYX_DEBUG === 'true';
    this.requestLoggingEnabled = !!opts.requestLoggingEnabled || envDebug;
    this.responseLoggingEnabled = !!opts.responseLoggingEnabled || envDebug;
    this.retryEnabled = opts.retryEnabled ?? true;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 3);
    this.retryInitialDelayMs = Math.max(0, opts.retryInitialDelayMs ?? 300);
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
    const headers = this.headers({
      ...(method === 'DELETE' ? { Prefer: 'return=representation' } : {}),
      ...(extraHeaders ?? {}),
    });
    const hasExplicitContentType =
      (extraHeaders && 'Content-Type' in extraHeaders) ||
      Object.prototype.hasOwnProperty.call(this.defaults, 'Content-Type');
    if (body == null && !hasExplicitContentType) delete headers['Content-Type'];
    if (this.requestLoggingEnabled) {
      console.log(`${method} ${url}`);
      if (body != null) {
        const logBody = typeof body === 'string' ? body : JSON.stringify(body);
        console.log(logBody);
      }
      const headerLog = { ...headers, 'x-onyx-secret': '[REDACTED]' };
      console.log('Headers:', headerLog);
    }
    const payload =
      body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
    const init = {
      method,
      headers,
      body: payload,
    };

    // Retries are limited to GET requests to avoid replaying mutations.
    const canRetry = this.retryEnabled && method === 'GET';
    const maxAttempts = canRetry ? this.maxRetries + 1 : 1;
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
            const serverRetry = HttpClient.parseRetryAfter(res.headers.get('retry-after'));
            const backoff = this.retryInitialDelayMs * HttpClient.fibonacci(attempt);
            const delay = serverRetry ?? backoff;
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          throw new OnyxHttpError(msg, res.status, res.statusText, data, raw);
        }
        return data as T;
      } catch (err) {
        const retryable =
          canRetry && (!(err instanceof OnyxHttpError) || err.status >= 500);
        if (attempt + 1 < maxAttempts && retryable) {
          const delay = this.retryInitialDelayMs * HttpClient.fibonacci(attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
    // unreachable but satisfies TypeScript
    throw new Error('Request failed after retries');
  }
}
