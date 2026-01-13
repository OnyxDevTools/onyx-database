// filename: src/config/types.ts
import type { FetchImpl } from '../types/common';

export interface ResolvedConfig {
  baseUrl: string;
  databaseId: string;
  apiKey: string;
  apiSecret: string;
  fetch: FetchImpl;
}

export interface ConfigSourceInfo {
  baseUrl: string;
  databaseId: string;
  apiKey: string;
  apiSecret: string;
  configPath?: string;
  projectFile?: string;
  homeProfile?: string;
}
