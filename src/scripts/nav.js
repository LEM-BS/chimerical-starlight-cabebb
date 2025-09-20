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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(navToggle, navLinks) {
  const withinMenu = navLinks
    ? Array.from(navLinks.querySelectorAll(FOCUSABLE_SELECTOR))
    : [];
  const elements = [];
  if (navToggle) {
    elements.push(navToggle);
  }
  withinMenu.forEach((item) => {
    if (!elements.includes(item)) {
      elements.push(item);
    }
  });
  return elements;
}

export function enableNavAccessibility(navToggle, navLinks, onRequestClose = () => {}) {
  if (!navToggle || !navLinks) {
    return () => {};
  }

  const pointerEvents = ['pointerdown', 'mousedown', 'touchstart'];

  const handleOutsidePointer = (event) => {
    if (!navLinks.classList.contains('nav-open')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (navLinks.contains(target) || navToggle.contains(target)) {
      return;
    }
    onRequestClose(false);
  };

  const handleKeydown = (event) => {
    if (!navLinks.classList.contains('nav-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onRequestClose(true);
      return;
    }

    if (event.key === 'Tab') {
      const focusables = getFocusableElements(navToggle, navLinks);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !focusables.includes(active)) {
          event.preventDefault();
          if (typeof last?.focus === 'function') {
            last.focus();
          }
        }
      } else if (active === last) {
        event.preventDefault();
        if (typeof first?.focus === 'function') {
          first.focus();
        }
      }
    }
  };

  const handleNavLinkClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('a')) {
      onRequestClose(true);
    }
  };

  const focusables = getFocusableElements(navToggle, navLinks);
  const firstInteractive = focusables.find((el) => el !== navToggle) ?? focusables[0];
  if (firstInteractive && typeof firstInteractive.focus === 'function') {
    firstInteractive.focus();
  }

  pointerEvents.forEach((eventName) => {
    document.addEventListener(eventName, handleOutsidePointer);
  });
  document.addEventListener('keydown', handleKeydown);
  navLinks.addEventListener('click', handleNavLinkClick);

  return () => {
    pointerEvents.forEach((eventName) => {
      document.removeEventListener(eventName, handleOutsidePointer);
    });
    document.removeEventListener('keydown', handleKeydown);
    navLinks.removeEventListener('click', handleNavLinkClick);
  };
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
    const isNavOpen = () => navLinks.classList.contains('nav-open');
    let cleanupAccessibility = null;

    const detachAccessibility = () => {
      if (cleanupAccessibility) {
        cleanupAccessibility();
        cleanupAccessibility = null;
      }
    };

    const closeMenu = (focusToggle = false) => {
      if (!isNavOpen()) return;
      navLinks.classList.remove('nav-open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      detachAccessibility();
      if (focusToggle && typeof navToggle.focus === 'function') {
        navToggle.focus();
      }
    };

    const attachAccessibility = () => {
      cleanupAccessibility = enableNavAccessibility(navToggle, navLinks, (focusToggle) => {
        closeMenu(focusToggle);
      });
    };

    /**
     * Ensure desktop state always shows navigation without relying on
     * `.nav-open` while keeping the toggle reset for wider viewports.
     */
    const enforceDesktopState = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) {
        if (isNavOpen()) {
          closeMenu();
        } else {
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }
    };

    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      const isOpen = toggleNav(navToggle, navLinks);
      if (isOpen) {
        detachAccessibility();
        attachAccessibility();
      } else {
        detachAccessibility();
      }
    });

    if (typeof window !== 'undefined') {
      enforceDesktopState();
      window.addEventListener('resize', enforceDesktopState);
    }

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
  window.LEMNav = { init, setupNav, loadTrustIndex, toggleNav, enableNavAccessibility };
}
