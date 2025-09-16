const DESKTOP_MEDIA_QUERY = '(min-width: 960px)';
const hasWindow = typeof window !== 'undefined';
const mediaQuery =
  hasWindow && typeof window.matchMedia === 'function'
    ? window.matchMedia(DESKTOP_MEDIA_QUERY)
    : null;

function isDesktopViewport() {
  return mediaQuery?.matches ?? false;
}

function updateNavAccessibility(navToggle, navLinks, isOpen) {
  if (!navToggle || !navLinks) return;
  if (isDesktopViewport()) {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.removeAttribute('aria-hidden');
  } else {
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navLinks.setAttribute('aria-hidden', String(!isOpen));
  }
}

export function toggleNav(navToggle, navLinks, force) {
  if (!navToggle || !navLinks) return false;
  const shouldOpen =
    typeof force === 'boolean'
      ? force
      : !navLinks.classList.contains('nav-open');

  navLinks.classList.toggle('nav-open', shouldOpen);
  navToggle.classList.toggle('open', shouldOpen);
  updateNavAccessibility(navToggle, navLinks, shouldOpen);
  return shouldOpen;
}

function closeNav(navToggle, navLinks) {
  return toggleNav(navToggle, navLinks, false);
}

function markActiveLinks() {
  if (typeof document === 'undefined') return;
  const path = hasWindow ? window.location.pathname : '';
  if (!path) return;

  document.querySelectorAll('.main-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    if (href === path || (path === '/' && href === '/index.html')) {
      link.setAttribute('aria-current', 'page');
    }
  });
}

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

export function setupNav() {
  if (typeof document === 'undefined') return;

  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (!navToggle || !navLinks) {
    markActiveLinks();
    return;
  }

  toggleNav(navToggle, navLinks, false);

  navToggle.addEventListener('click', () => {
    toggleNav(navToggle, navLinks);
  });

  const collapseOnLinkClick = () => {
    if (isDesktopViewport()) return;
    closeNav(navToggle, navLinks);
  };

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', collapseOnLinkClick);
  });

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      navLinks.classList.contains('nav-open') &&
      !isDesktopViewport()
    ) {
      closeNav(navToggle, navLinks);
      navToggle.focus();
    }
  });

  if (mediaQuery) {
    const handleViewportChange = () => {
      if (isDesktopViewport()) {
        navLinks.classList.remove('nav-open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navLinks.removeAttribute('aria-hidden');
      } else {
        closeNav(navToggle, navLinks);
      }
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleViewportChange);
    } else if ('onchange' in mediaQuery) {
      mediaQuery.onchange = handleViewportChange;
    }

    handleViewportChange();
  }

  markActiveLinks();
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

if (hasWindow) {
  window.loadTrustIndex = loadTrustIndex;
  window.LEMNav = { init, setupNav, loadTrustIndex, toggleNav };
}
