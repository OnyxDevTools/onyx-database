// filename: src/config/defaults.ts
export const DEFAULT_BASE_URL = 'https://api.onyx.dev';
export const DEFAULT_AI_BASE_URL = 'https://ai.onyx.dev';

export const sanitizeBaseUrl = (u: string): string => u.replace(/\/+$/, '');
