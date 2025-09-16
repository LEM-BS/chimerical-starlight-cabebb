import { beforeEach, expect, test, vi } from 'vitest';

const NAV_MODULE_PATH = '../src/scripts/nav.js';

function createMatchMedia(matches = false) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueryList = {
    matches,
    media: '(min-width: 960px)',
    onchange: null,
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: (event: MediaQueryListEvent) => {
      listeners.forEach((listener) => listener(event));
      return true;
    }
  } as MediaQueryList;

  return vi.fn().mockImplementation(() => mediaQueryList);
}

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = '';
  document.body.innerHTML = `
    <button class="nav-toggle" aria-expanded="false"></button>
    <ul class="nav-links">
      <li><a href="/index.html">Home</a></li>
      <li><a href="/services.html">Services</a></li>
    </ul>
  `;
});

test('toggles navigation classes on click', async () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(false)
  });
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
  expect(navLinks?.getAttribute('aria-hidden')).toBe('false');

  const closed = navModule.toggleNav(navToggle!, navLinks!);
  expect(closed).toBe(false);
  expect(navLinks?.classList.contains('nav-open')).toBe(false);
  expect(navToggle?.classList.contains('open')).toBe(false);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('false');
  expect(navLinks?.getAttribute('aria-hidden')).toBe('true');
});

test('loadTrustIndex injects script once', async () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(false)
  });
  const navModule = await import(NAV_MODULE_PATH);
  navModule.loadTrustIndex();
  navModule.loadTrustIndex();

  const scripts = document.querySelectorAll('script[src^="https://cdn.trustindex.io/loader.js"]');
  expect(scripts).toHaveLength(1);
});

test('setupNav closes the menu after activating a link on mobile', async () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(false)
  });

  const navModule = await import(NAV_MODULE_PATH);
  navModule.setupNav();

  const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const firstLink = navLinks?.querySelector('a');
  expect(navToggle).not.toBeNull();
  expect(navLinks).not.toBeNull();
  expect(firstLink).not.toBeNull();

  navModule.toggleNav(navToggle!, navLinks!);
  expect(navLinks?.classList.contains('nav-open')).toBe(true);

  firstLink?.dispatchEvent(new Event('click'));
  expect(navLinks?.classList.contains('nav-open')).toBe(false);
  expect(navLinks?.getAttribute('aria-hidden')).toBe('true');
});

test('desktop view keeps navigation visible for assistive tech', async () => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: createMatchMedia(true)
  });

  const navModule = await import(NAV_MODULE_PATH);
  const navToggle = document.querySelector<HTMLButtonElement>('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  expect(navToggle).not.toBeNull();
  expect(navLinks).not.toBeNull();

  navModule.toggleNav(navToggle!, navLinks!);
  expect(navToggle?.getAttribute('aria-expanded')).toBe('false');
  expect(navLinks?.getAttribute('aria-hidden')).toBeNull();
});
