import { beforeEach, expect, test, vi } from 'vitest';

const NAV_MODULE_PATH = '../src/scripts/nav.js';

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = `
    <button class="nav-toggle" aria-controls="secondary-navigation" aria-expanded="false"></button>
    <ul class="nav-links" hidden>
      <a href="/index.html">Home</a>
    </ul>
  `;
});

test('toggles navigation classes on click', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  expect(typeof navModule.setupNav).toBe('function');
  const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  expect(navToggle).not.toBeNull();
  expect(navLinks).not.toBeNull();
  const opened = navModule.toggleNav(navToggle!, navLinks!);
  expect(opened).toBe(true);
  expect(navLinks?.classList.contains('nav-open')).toBe(true);
  expect(navToggle?.classList.contains('open')).toBe(true);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('true');
  expect(navLinks?.hasAttribute('hidden')).toBe(false);

  const closed = navModule.toggleNav(navToggle!, navLinks!);
  expect(closed).toBe(false);
  expect(navLinks?.classList.contains('nav-open')).toBe(false);
  expect(navToggle?.classList.contains('open')).toBe(false);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('false');
  expect(navLinks?.hasAttribute('hidden')).toBe(true);
});

test('loadTrustIndex injects script once', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.loadTrustIndex();
  navModule.loadTrustIndex();

  const scripts = document.querySelectorAll('script[src^="https://cdn.trustindex.io/loader.js"]');
  expect(scripts).toHaveLength(1);
});

