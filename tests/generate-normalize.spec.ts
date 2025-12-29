import { describe, it, expect, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateTypes } from '../gen/generate';
import { onyx } from '../src';

describe('generateTypes schema normalization', () => {
  it('accepts schema entities shape and emits types', async () => {
    const tmpBase = await fs.mkdtemp(join(tmpdir(), 'onyx-schema-'));
    const schemaPath = join(tmpBase, 'schema.json');
    const typesPath = join(tmpBase, 'types.ts');

    const schema = {
      entities: [
        {
          name: 'Sample',
          attributes: [
            { name: 'value', type: 'Float', isNullable: false },
            { name: 'details', type: 'EmbeddedObject', isNullable: true },
          ],
        },
      ],
    };

    await fs.writeFile(schemaPath, JSON.stringify(schema), 'utf8');

    try {
      await generateTypes({
        source: 'file',
        schemaPath,
        typesOutFile: typesPath,
        quiet: true,
      });

      const output = await fs.readFile(typesPath, 'utf8');
      expect(output).toContain('export interface Sample');
      expect(output).toContain('value?: number');
      expect(output).toContain('details: any | null;');
    } finally {
      await fs.rm(tmpBase, { recursive: true, force: true });
    }
  });

  it('fetches schema via API source using onyx.getSchema', async () => {
    const tmpBase = await fs.mkdtemp(join(tmpdir(), 'onyx-schema-api-'));
    const typesPath = join(tmpBase, 'types.ts');

    const prevEnv = {
      id: process.env.ONYX_DATABASE_ID,
      baseUrl: process.env.ONYX_DATABASE_BASE_URL,
      apiKey: process.env.ONYX_DATABASE_API_KEY,
      apiSecret: process.env.ONYX_DATABASE_API_SECRET,
    };
    process.env.ONYX_DATABASE_ID = 'db-id';
    process.env.ONYX_DATABASE_BASE_URL = 'https://api.test';
    process.env.ONYX_DATABASE_API_KEY = 'key';
    process.env.ONYX_DATABASE_API_SECRET = 'secret';

    const getSchemaMock = vi.fn().mockResolvedValue({
      databaseId: 'db-id',
      entities: [
        {
          name: 'ApiOnly',
          attributes: [{ name: 'amount', type: 'Long', isNullable: false }],
        },
      ],
    });
    const initSpy = vi.spyOn(onyx, 'init').mockReturnValue({
      getSchema: getSchemaMock,
    } as unknown as ReturnType<typeof onyx.init>);

    try {
      await generateTypes({
        source: 'api',
        typesOutFile: typesPath,
        quiet: true,
      });

      const output = await fs.readFile(typesPath, 'utf8');
      expect(getSchemaMock).toHaveBeenCalledTimes(1);
      expect(output).toContain('export interface ApiOnly');
      expect(output).toContain('amount?: number');
    } finally {
      initSpy.mockRestore();
      if (prevEnv.id === undefined) delete process.env.ONYX_DATABASE_ID;
      else process.env.ONYX_DATABASE_ID = prevEnv.id;
      if (prevEnv.baseUrl === undefined) delete process.env.ONYX_DATABASE_BASE_URL;
      else process.env.ONYX_DATABASE_BASE_URL = prevEnv.baseUrl;
      if (prevEnv.apiKey === undefined) delete process.env.ONYX_DATABASE_API_KEY;
      else process.env.ONYX_DATABASE_API_KEY = prevEnv.apiKey;
      if (prevEnv.apiSecret === undefined) delete process.env.ONYX_DATABASE_API_SECRET;
      else process.env.ONYX_DATABASE_API_SECRET = prevEnv.apiSecret;
      await fs.rm(tmpBase, { recursive: true, force: true });
    }
  });
});
