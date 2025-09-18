const AREA_SELECT_SELECTOR = 'select[data-area-select]';
const MAILTO_SELECTOR = 'a[href^="mailto:"]';

function navigateToArea(select) {
  const value = (select.value || '').trim();

  if (value) {
    window.location.href = value;
  }
}

function setupAreaSelects() {
  const selects = document.querySelectorAll(AREA_SELECT_SELECTOR);

  selects.forEach((select) => {
    if (select.dataset.areaSelectBound === 'true') {
      return;
    }

    select.addEventListener('change', () => navigateToArea(select));
    select.dataset.areaSelectBound = 'true';
  });
}

function setupMailtoTracking() {
  const links = document.querySelectorAll(MAILTO_SELECTOR);

  links.forEach((link) => {
    if (link.dataset.mailtoTracked === 'true') {
      return;
    }

    link.addEventListener('click', () => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'mailto_click', {
          email: link.getAttribute('href') || '',
        });
      }
    });

    link.dataset.mailtoTracked = 'true';
  });
}

function initEnhancements() {
  setupAreaSelects();
  setupMailtoTracking();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
  initEnhancements();
}
