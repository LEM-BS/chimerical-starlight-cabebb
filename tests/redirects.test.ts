import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const redirectsPath = resolve(__dirname, '../public/_redirects');

const normalisePath = (input: string) =>
  input
    .replace(/^https?:\/\/(www\.)?lembuildingsurveying\.co\.uk/i, '')
    .replace(/\/+$/, '') || '/';

test('contact and enquiry requests are not rewritten to thank-you', () => {
  const raw = readFileSync(redirectsPath, 'utf8');
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const disallowedSources = new Set(['/contact', '/enquiry']);

  const offenders = lines.filter((line) => {
    const [from = '', to = ''] = line.split(/\s+/);
    const source = normalisePath(from);
    const target = normalisePath(to);

    return (
      disallowedSources.has(source) &&
      (target === '/thank-you' || target === 'thank-you')
    );
  });

  expect(offenders).toEqual([]);
});
