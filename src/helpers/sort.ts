// filename: src/helpers/sort.ts
import type { Sort } from '../types/common';

export const asc = (field: string): Sort => ({ field, order: 'ASC' });
export const desc = (field: string): Sort => ({ field, order: 'DESC' });