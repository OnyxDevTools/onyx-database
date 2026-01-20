// filename: src/config/types.ts
import type { FetchImpl } from '../types/common';

export interface ResolvedConfig {
  baseUrl: string;
  aiBaseUrl: string;
  defaultModel: string;
  databaseId: string;
  apiKey: string;
  apiSecret: string;
  fetch: FetchImpl;
  retryEnabled: boolean;
  maxRetries: number;
  retryInitialDelayMs: number;
}

export interface ConfigSourceInfo {
  baseUrl: string;
  aiBaseUrl: string;
  defaultModel: string;
  databaseId: string;
  apiKey: string;
  apiSecret: string;
  configPath?: string;
  projectFile?: string;
  homeProfile?: string;
}
