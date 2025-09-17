const INDEX_HTML_PATTERN = /\/index\.html$/;
const HTML_EXTENSION_PATTERN = /\.html$/;

function normalizePathname(pathname) {
  if (!pathname) return '';
  let normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  normalized = normalized.replace(INDEX_HTML_PATTERN, '/');
  normalized = normalized.replace(HTML_EXTENSION_PATTERN, '');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized || '/';
}

export function loadTrustIndex() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src^="https://cdn.trustindex.io/loader.js"]')) {
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.trustindex.io/loader.js?f82e0f551228447e6c06f9b86c7';
  script.async = true;
  document.head.appendChild(script);
}

export function toggleNav(navToggle, navLinks) {
  if (!navToggle || !navLinks) return false;
  const isOpen = navLinks.classList.toggle('nav-open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  return isOpen;
}

export function setupNav() {
  if (typeof document === 'undefined') return;
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      toggleNav(navToggle, navLinks);
    });
  }

  if (typeof window !== 'undefined') {
    const currentPath = normalizePathname(
      new URL(window.location.pathname, window.location.origin).pathname,
    );
    if (currentPath) {
      document.querySelectorAll('.main-nav a').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const linkPath = normalizePathname(
          new URL(href, window.location.origin).pathname,
        );
        if (linkPath && linkPath === currentPath) {
          link.setAttribute('aria-current', 'page');
        }
      });
    }
  }
}

export function init() {
  setupNav();
  loadTrustIndex();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}

if (typeof window !== 'undefined') {
  window.loadTrustIndex = loadTrustIndex;
  window.LEMNav = { init, setupNav, loadTrustIndex, toggleNav };
}
