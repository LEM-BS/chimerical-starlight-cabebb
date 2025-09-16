export function loadTrustIndex() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src^="https://cdn.trustindex.io/loader.js"]')) {
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.trustindex.io/loader.js?f82e0f551228447e6c06f9b86c7';
  script.async = true;
  script.defer = true;
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

  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path) {
    document.querySelectorAll('.main-nav a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (href === path || (path === '/' && href === '/index.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });
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
