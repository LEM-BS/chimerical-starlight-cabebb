const focusableSelector =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

function getFocusableElements(container) {
  if (!container) return [];
  const elements = Array.from(container.querySelectorAll(focusableSelector));
  return elements.filter((element) => {
    if (!(element instanceof HTMLElement)) return false;
    return !element.hasAttribute('disabled') && element.tabIndex !== -1;
  });
}

function setNavState(navToggle, navLinks, isOpen) {
  if (!navToggle || !navLinks) return;
  navLinks.classList.toggle('nav-open', isOpen);
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
}

export function loadTrustIndex() {
  if (typeof document === 'undefined') return;
  if (!document.querySelector('.ti-widget')) {
    return;
  }
  if (document.querySelector('script[src^="https://cdn.trustindex.io/loader.js"]')) {
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://cdn.trustindex.io/loader.js?f82e0f551228447e6c06f9b86c7';
  script.async = true;
  document.head.appendChild(script);
}

export function toggleNav(navToggle, navLinks, desiredState) {
  if (!navToggle || !navLinks) return false;
  const isCurrentlyOpen = navLinks.classList.contains('nav-open');
  const isOpen =
    typeof desiredState === 'boolean' ? desiredState : !isCurrentlyOpen;
  setNavState(navToggle, navLinks, isOpen);
  return isOpen;
}

export function setupNav() {
  if (typeof document === 'undefined') return;
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    let lastFocusedElement = null;

    const removeGlobalListeners = () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };

    const closeNav = ({ restoreFocus = true } = {}) => {
      const wasOpen = navLinks.classList.contains('nav-open');
      if (!wasOpen) {
        removeGlobalListeners();
        return;
      }
      toggleNav(navToggle, navLinks, false);
      removeGlobalListeners();
      if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
      lastFocusedElement = null;
    };

    const focusFirstItem = () => {
      const focusable = getFocusableElements(navLinks);
      if (focusable.length > 0) {
        focusable[0].focus();
        return;
      }
      navToggle.focus();
    };

    const handleDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (navLinks.contains(target) || navToggle.contains(target)) {
        return;
      }
      closeNav({ restoreFocus: false });
    };

    const handleKeyDown = (event) => {
      if (!navLinks.classList.contains('nav-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeNav();
        navToggle.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(navLinks);
      const trapElements = navToggle
        ? [navToggle, ...focusable]
        : focusable;

      if (trapElements.length === 0) {
        event.preventDefault();
        navToggle.focus();
        return;
      }

      const firstElement = trapElements[0];
      const lastElement = trapElements[trapElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !navLinks.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const openNav = () => {
      if (navLinks.classList.contains('nav-open')) {
        return;
      }
      lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : navToggle;
      toggleNav(navToggle, navLinks, true);
      document.addEventListener('click', handleDocumentClick, true);
      document.addEventListener('keydown', handleKeyDown, true);
      focusFirstItem();
    };

    /**
     * Ensure desktop state always shows navigation without relying on
     * `.nav-open` while keeping the toggle reset for wider viewports.
     */
    const enforceDesktopState = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) {
        closeNav({ restoreFocus: false });
        toggleNav(navToggle, navLinks, false);
      }
    };

    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      if (navLinks.classList.contains('nav-open')) {
        closeNav();
      } else {
        openNav();
      }
    });

    navLinks.addEventListener('click', (event) => {
      const link = event.target instanceof HTMLElement ? event.target.closest('a') : null;
      if (link) {
        closeNav();
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
  window.LEMNav = { init, setupNav, loadTrustIndex, toggleNav };
}
