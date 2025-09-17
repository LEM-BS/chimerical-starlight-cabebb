import { beforeEach, expect, test, vi } from 'vitest';

const NAV_MODULE_PATH = '../src/scripts/nav.js';

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = `
    <nav class="main-nav">
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links"></button>
      <div class="nav-links" id="nav-links" aria-hidden="true">
        <a href="/index.html">Home</a>
      </div>
    </nav>
  `;
  window.history.pushState({}, '', '/');
});

test('toggles navigation classes on click', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  expect(typeof navModule.setupNav).toBe('function');
  const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const mainNav = document.querySelector('.main-nav');
  expect(navToggle).not.toBeNull();
  expect(navLinks).not.toBeNull();
  expect(mainNav).not.toBeNull();
  const opened = navModule.toggleNav(navToggle!, navLinks!);
  expect(opened).toBe(true);
  expect(mainNav?.classList.contains('is-open')).toBe(true);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('true');
  expect(navLinks?.getAttribute('aria-hidden')).toBe('false');
  expect(navLinks?.hasAttribute('inert')).toBe(false);

  const closed = navModule.toggleNav(navToggle!, navLinks!);
  expect(closed).toBe(false);
  expect(mainNav?.classList.contains('is-open')).toBe(false);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('false');
  expect(navLinks?.getAttribute('aria-hidden')).toBe('true');
  expect(navLinks?.hasAttribute('inert')).toBe(true);
});

test('loadTrustIndex injects script once', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.loadTrustIndex();
  navModule.loadTrustIndex();

  const scripts = document.querySelectorAll('script[src^="https://cdn.trustindex.io/loader.js"]');
  expect(scripts).toHaveLength(1);
});

test('highlights .html link when current path is extensionless', async () => {
  document.body.innerHTML = `
    <nav class="main-nav">
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links"></button>
      <div class="nav-links" id="nav-links" aria-hidden="true">
        <a href="/index.html">Home</a>
      </div>
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
    <nav class="main-nav">
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links"></button>
      <div class="nav-links" id="nav-links" aria-hidden="true">
        <a href="/index.html">Home</a>
      </div>
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
