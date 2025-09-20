import { beforeEach, expect, test, vi } from 'vitest';

const NAV_MODULE_PATH = '../src/scripts/nav.js';

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <div class="nav-links">
      <a href="/">Home</a>
    </div>
  `;
  window.history.pushState({}, '', '/');
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

  const closed = navModule.toggleNav(navToggle!, navLinks!);
  expect(closed).toBe(false);
  expect(navLinks?.classList.contains('nav-open')).toBe(false);
  expect(navToggle?.classList.contains('open')).toBe(false);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('false');
});

test('loadTrustIndex injects script once', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.loadTrustIndex();
  navModule.loadTrustIndex();

  const scripts = document.querySelectorAll('script[src^="https://cdn.trustindex.io/loader.js"]');
  expect(scripts).toHaveLength(1);
});

test('normalizePathname strips index.html and .html suffixes', async () => {
  const { normalizePathname } = await import(NAV_MODULE_PATH);

  expect(normalizePathname('/index.html')).toBe('/');
  expect(normalizePathname('/services/index.html')).toBe('/services');
  expect(normalizePathname('/contact.html')).toBe('/contact');
  expect(normalizePathname('local-surveys.html')).toBe('/local-surveys');
  expect(normalizePathname('')).toBe('');
});

test('highlights .html link when current path is extensionless', async () => {
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <div class="nav-links">
      <a href="/index.html">Home</a>
    </div>
    <nav class="main-nav">
      <a href="/services.html" class="services-link">Services</a>
    </nav>
  `;
  window.history.pushState({}, '', '/services');

  const navModule = await import(NAV_MODULE_PATH);
  const link = document.querySelector<HTMLAnchorElement>('.services-link');
  expect(link).not.toBeNull();
  navModule.setupNav();

  expect(link?.getAttribute('aria-current')).toBe('page');
});

test('highlights extensionless link when current path includes extension', async () => {
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <div class="nav-links">
      <a href="/index.html">Home</a>
    </div>
    <nav class="main-nav">
      <a href="/services" class="services-link">Services</a>
    </nav>
  `;
  window.history.pushState({}, '', '/services.html');

  const navModule = await import(NAV_MODULE_PATH);
  const link = document.querySelector<HTMLAnchorElement>('.services-link');
  expect(link).not.toBeNull();
  navModule.setupNav();

  expect(link?.getAttribute('aria-current')).toBe('page');
});
