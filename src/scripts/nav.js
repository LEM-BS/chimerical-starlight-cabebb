const NAV_OPEN_CLASS = 'is-open';
const focusMemory = new WeakMap();
const cleanupMap = new WeakMap();

function normalizePathname(pathname) {
  if (!pathname) return '';
  let normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  normalized = normalized.replace(/\/index\.html$/, '/');
  normalized = normalized.replace(/\.html$/, '');
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

function setNavState(mainNav, navToggle, navLinks, isOpen) {
  mainNav.classList.toggle(NAV_OPEN_CLASS, isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navLinks.setAttribute('aria-hidden', String(!isOpen));
  if ('inert' in navLinks) {
    navLinks.inert = !isOpen;
  } else if (!isOpen) {
    navLinks.setAttribute('inert', '');
  } else {
    navLinks.removeAttribute('inert');
  }
}

function getFocusableElements(container) {
  if (!container) return [];
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(','))).filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.hasAttribute('disabled') &&
      element.tabIndex !== -1 &&
      !element.closest('[aria-hidden="true"]'),
  );
}

function focusFirstMenuItem(navLinks, fallback) {
  const firstItem = navLinks?.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
  const target = (firstItem instanceof HTMLElement ? firstItem : fallback) ?? null;
  if (target) {
    try {
      target.focus({ preventScroll: true });
    } catch (error) {
      target.focus();
    }
  }
}

function createNavListeners(mainNav, navToggle, navLinks) {
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeNav(mainNav, navToggle, navLinks);
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(mainNav);
    if (!focusable.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === first || !focusable.includes(activeElement)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleDocumentClick = (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (!mainNav.contains(target)) {
      closeNav(mainNav, navToggle, navLinks);
    }
  };

  mainNav.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleDocumentClick);

  return () => {
    mainNav.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleDocumentClick);
  };
}

export function openNav(mainNav, navToggle, navLinks) {
  if (!mainNav || !navToggle || !navLinks) return false;
  if (mainNav.classList.contains(NAV_OPEN_CLASS)) {
    return true;
  }
  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement) {
    focusMemory.set(mainNav, activeElement);
  } else {
    focusMemory.set(mainNav, navToggle);
  }
  setNavState(mainNav, navToggle, navLinks, true);
  const cleanup = createNavListeners(mainNav, navToggle, navLinks);
  cleanupMap.set(mainNav, cleanup);
  focusFirstMenuItem(navLinks, navToggle);
  return true;
}

export function closeNav(mainNav, navToggle, navLinks) {
  if (!mainNav || !navToggle || !navLinks) return false;
  if (!mainNav.classList.contains(NAV_OPEN_CLASS)) {
    return false;
  }
  setNavState(mainNav, navToggle, navLinks, false);
  const cleanup = cleanupMap.get(mainNav);
  if (typeof cleanup === 'function') {
    cleanup();
    cleanupMap.delete(mainNav);
  }
  const previousFocus = focusMemory.get(mainNav);
  focusMemory.delete(mainNav);
  const focusTarget = previousFocus instanceof HTMLElement ? previousFocus : navToggle;
  if (focusTarget) {
    try {
      focusTarget.focus({ preventScroll: true });
    } catch (error) {
      focusTarget.focus();
    }
  }
  return false;
}

export function toggleNav(navToggle, navLinks, mainNavArg) {
  const mainNav = mainNavArg || (navToggle ? navToggle.closest('.main-nav') : null);
  if (!navToggle || !navLinks || !mainNav) return false;
  return mainNav.classList.contains(NAV_OPEN_CLASS)
    ? closeNav(mainNav, navToggle, navLinks)
    : openNav(mainNav, navToggle, navLinks);
}

export function setupNav() {
  if (typeof document === 'undefined') return;
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const mainNav = navToggle ? navToggle.closest('.main-nav') : null;

  if (navToggle && navLinks && mainNav) {
    setNavState(mainNav, navToggle, navLinks, false);

    navToggle.addEventListener('click', () => {
      toggleNav(navToggle, navLinks, mainNav);
    });

    navLinks.addEventListener('click', (event) => {
      if (!mainNav.classList.contains(NAV_OPEN_CLASS)) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const interactive = target.closest('a, button');
      if (interactive) {
        closeNav(mainNav, navToggle, navLinks);
      }
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
        const linkPath = normalizePathname(new URL(href, window.location.origin).pathname);
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
  window.LEMNav = { init, setupNav, loadTrustIndex, toggleNav, openNav, closeNav };
}
