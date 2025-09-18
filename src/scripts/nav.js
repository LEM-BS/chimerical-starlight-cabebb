const TRUST_INDEX_SELECTOR = '.ti-widget';
const TRUST_INDEX_SCRIPT_QUERY =
  'script[src^="https://cdn.trustindex.io/loader.js"]';
const TRUST_INDEX_SCRIPT_URL =
  'https://cdn.trustindex.io/loader.js?f82e0f551228447e6c06f9b86c7';
const AREA_DROPDOWN_SELECTOR = '[data-area-dropdown]';
const MAILTO_SELECTOR = 'a[href^="mailto:"]';
const ENHANCED_FORM_SELECTOR = '[data-enhanced-form]';

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
  if (!document.querySelector(TRUST_INDEX_SELECTOR)) return;
  if (document.querySelector(TRUST_INDEX_SCRIPT_QUERY)) return;
  const script = document.createElement('script');
  script.src = TRUST_INDEX_SCRIPT_URL;
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
    const enforceDesktopState = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 768) {
        navLinks.classList.remove('nav-open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    };

    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', () => {
      toggleNav(navToggle, navLinks);
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

export function bindAreaDropdowns() {
  if (typeof document === 'undefined') return;
  const dropdowns = document.querySelectorAll(AREA_DROPDOWN_SELECTOR);
  dropdowns.forEach((dropdown) => {
    if (!(dropdown instanceof HTMLSelectElement)) return;
    if (dropdown.dataset.dropdownBound === 'true') return;
    dropdown.dataset.dropdownBound = 'true';
    dropdown.addEventListener('change', () => {
      if (typeof window === 'undefined') return;
      if (dropdown.value) {
        window.location.href = dropdown.value;
      }
    });
  });
}

export function trackMailtoLinks() {
  if (typeof document === 'undefined') return;
  const links = document.querySelectorAll(MAILTO_SELECTOR);
  links.forEach((link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.dataset.mailtoTracked === 'true') return;
    link.dataset.mailtoTracked = 'true';
    link.addEventListener('click', () => {
      if (typeof window === 'undefined') return;
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'mailto_click', {
          email: link.getAttribute('href'),
        });
      }
    });
  });
}

function normalisePropertyValue(input) {
  const rawValue = input.value.trim();
  if (rawValue === '') {
    input.setCustomValidity('');
    return '';
  }

  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    input.setCustomValidity('Please enter a positive number.');
  } else {
    input.setCustomValidity('');
    input.value = rawValue;
  }
  return rawValue;
}

export function setupEnhancedForms() {
  if (typeof document === 'undefined') return;
  const forms = document.querySelectorAll(ENHANCED_FORM_SELECTOR);
  forms.forEach((form) => {
    if (!(form instanceof HTMLFormElement)) return;
    if (form.dataset.enhancedBound === 'true') return;
    form.dataset.enhancedBound = 'true';

    const propertyValueInput = form.querySelector(
      'input[name="property-value"]',
    );
    const handlePropertyValue = () => {
      if (propertyValueInput instanceof HTMLInputElement) {
        normalisePropertyValue(propertyValueInput);
      }
    };

    if (propertyValueInput instanceof HTMLInputElement) {
      propertyValueInput.addEventListener('input', handlePropertyValue);
      propertyValueInput.addEventListener('blur', handlePropertyValue);
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      handlePropertyValue();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const formData = new FormData(form);
      if (propertyValueInput instanceof HTMLInputElement) {
        formData.set('property-value', propertyValueInput.value.trim());
      }

      const requestInit = {
        method: form.method?.toUpperCase() || 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      };

      try {
        const response = await fetch(form.action, requestInit);
        if (!response.ok) {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        alert('Sorry, something went wrong. Please email us directly.');
        return;
      }

      const conversionId = form.dataset.conversionId;
      if (
        conversionId &&
        typeof window !== 'undefined' &&
        typeof window.gtag === 'function'
      ) {
        window.gtag('event', 'conversion', { send_to: conversionId });
      }

      const redirectUrl = form.dataset.successRedirect;
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      } else {
        form.reset();
      }
    });
  });
}

export function fireConversionEvent() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const { body } = document;
  if (!body) return;
  const conversionEvent = body.dataset.conversionEvent;
  if (!conversionEvent || body.dataset.conversionFired === 'true') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: conversionEvent });
    body.dataset.conversionFired = 'true';
  }
}

export function init() {
  setupNav();
  bindAreaDropdowns();
  trackMailtoLinks();
  setupEnhancedForms();
  loadTrustIndex();
  fireConversionEvent();
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
  window.LEMNav = {
    init,
    setupNav,
    loadTrustIndex,
    toggleNav,
    bindAreaDropdowns,
    trackMailtoLinks,
    setupEnhancedForms,
    fireConversionEvent,
  };
}
