import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const NAV_MODULE_PATH = '../src/scripts/nav.js';
type NavModule = typeof import('../src/scripts/nav.js');

const cleanupCallbacks: Array<() => void> = [];

const registerCleanup = (callback: () => void) => {
  cleanupCallbacks.push(callback);
  return callback;
};

afterEach(() => {
  while (cleanupCallbacks.length > 0) {
    const cleanup = cleanupCallbacks.pop();
    cleanup?.();
  }
});

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <div class="nav-links">
      <a href="/index.html">Home</a>
      <a href="/services.html">Services</a>
    </div>
    <nav class="main-nav">
      <a href="/services.html" class="services-link">Services</a>
    </nav>
  `;
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 375 });
  window.history.pushState({}, '', '/');
  cleanupCallbacks.length = 0;
});

function getNavElements() {
  const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector<HTMLElement>('.nav-links');
  expect(navToggle).not.toBeNull();
  expect(navLinks).not.toBeNull();
  return { navToggle: navToggle!, navLinks: navLinks! };
}

function closeMenu(navToggle: HTMLButtonElement, navLinks: HTMLElement, focusToggle: boolean) {
  navLinks.classList.remove('nav-open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  if (focusToggle && typeof navToggle.focus === 'function') {
    navToggle.focus();
  }
}

function openMenu(navModule: NavModule) {
  const { navToggle, navLinks } = getNavElements();
  const opened = navModule.toggleNav(navToggle, navLinks);
  expect(opened).toBe(true);
  expect(navLinks.classList.contains('nav-open')).toBe(true);
  expect(navToggle.getAttribute('aria-expanded')).toBe('true');

  const cleanup = registerCleanup(
    navModule.enableNavAccessibility(navToggle, navLinks, (focusToggle) => {
      closeMenu(navToggle, navLinks, focusToggle);
    }),
  );

  return { navToggle, navLinks, cleanup };
}

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

test('closes the menu when clicking outside', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.setupNav();

  const { navToggle, navLinks } = openMenu(navModule);

  document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

  expect(navLinks.classList.contains('nav-open')).toBe(false);
  expect(navToggle.getAttribute('aria-expanded')).toBe('false');
});

test('closes the menu when a navigation link is activated', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.setupNav();

  const { navToggle, navLinks } = openMenu(navModule);
  const menuLinks = navLinks.querySelectorAll('a');
  expect(menuLinks.length).toBeGreaterThan(0);

  menuLinks.forEach((link) => {
    link.setAttribute('href', '#');
    link.addEventListener('click', (event) => event.preventDefault());
  });

  menuLinks[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));

  expect(navLinks.classList.contains('nav-open')).toBe(false);
  expect(navToggle.getAttribute('aria-expanded')).toBe('false');
});

test('escape key closes the menu and restores focus to the toggle', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.setupNav();

  const { navToggle, navLinks } = openMenu(navModule);

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

  expect(navLinks.classList.contains('nav-open')).toBe(false);
  expect(document.activeElement).toBe(navToggle);
});

test('focus remains trapped within the open menu', async () => {
  const navModule = await import(NAV_MODULE_PATH);
  navModule.setupNav();

  const { navToggle, navLinks } = openMenu(navModule);
  const menuLinks = navLinks.querySelectorAll<HTMLAnchorElement>('a');
  expect(menuLinks.length).toBeGreaterThan(0);
  expect(document.activeElement).toBe(menuLinks[0] ?? null);

  menuLinks[menuLinks.length - 1].focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  expect(document.activeElement).toBe(navToggle);

  navToggle?.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  expect(document.activeElement).toBe(menuLinks[menuLinks.length - 1] ?? null);
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

test('highlights extensionless link when current path matches exactly', async () => {
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <div class="nav-links">
      <a href="/services">Services</a>
    </div>
    <nav class="main-nav">
      <a href="/services" class="services-link">Services</a>
    </nav>
  `;
  window.history.pushState({}, '', '/services');

  const navModule = await import(NAV_MODULE_PATH);
  const link = document.querySelector<HTMLAnchorElement>('.services-link');
  expect(link).not.toBeNull();
  navModule.setupNav();

  expect(link?.getAttribute('aria-current')).toBe('page');
});
