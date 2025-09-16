import { beforeAll, expect, test } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: projectRoot, env: process.env });
}, 120_000);

test('dist/index.html has no broken internal links', async () => {
  const { stdout } = await execFileAsync(
    'npx',
    [
      'linkinator',
      'dist/index.html',
      '--silent',
      '--recurse=false',
      '--skip',
      '^https?://'
    ],
    { cwd: projectRoot, env: process.env }
  );

  expect(stdout).not.toMatch(/BROKEN/);
});
