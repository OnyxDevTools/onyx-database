import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'next-edge');
const nextBin = path.join(
  repoRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next',
);

const buildEnv = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  ONYX_DATABASE_ID: 'edge-db',
  ONYX_DATABASE_BASE_URL: 'http://edge',
  ONYX_DATABASE_API_KEY: 'edge-key',
  ONYX_DATABASE_API_SECRET: 'edge-secret',
};

const runCommand = (args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(nextBin, args, {
      cwd,
      env: buildEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => {
      stdout += data.toString();
    });
    child.stderr.on('data', data => {
      stderr += data.toString();
    });
    child.on('close', code => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`next ${args.join(' ')} failed (${code})\n${stdout}\n${stderr}`));
      }
    });
  });

const waitForServer = async (url: string, timeoutMs: number): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Server did not respond within ${timeoutMs}ms`);
};

describe('Next.js edge integration', () => {
  it(
    'builds and serves via turbopack without serverExternalPackages',
    async () => {
      const onyxScopeDir = path.join(fixtureDir, 'node_modules', '@onyx.dev');
      const pkgDir = path.join(onyxScopeDir, 'onyx-database');
      await rm(pkgDir, { recursive: true, force: true });
      await mkdir(pkgDir, { recursive: true });
      await cp(path.join(repoRoot, 'package.json'), path.join(pkgDir, 'package.json'));
      await cp(path.join(repoRoot, 'dist'), path.join(pkgDir, 'dist'), { recursive: true });

      await runCommand(['build'], fixtureDir);

      const port = 4020;
      const server = spawn(nextBin, ['dev', '--turbo', '-p', String(port)], {
        cwd: fixtureDir,
        env: buildEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      try {
        await waitForServer(`http://localhost:${port}/api/health`, 30_000);
        const response = await fetch(`http://localhost:${port}/api/health`);
        expect(response.ok).toBe(true);
      } finally {
        server.kill('SIGTERM');
      }
    },
    120_000,
  );
});
