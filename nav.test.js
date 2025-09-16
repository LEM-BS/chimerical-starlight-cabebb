/**
 * @jest-environment jsdom
 */

beforeEach(async () => {
  document.body.innerHTML = `
    <button class="nav-toggle"></button>
    <div class="nav-links">
      <a href="/index.html">Home</a>
    </div>
    <div id="header-include"></div>
    <div id="footer-include"></div>
  `;

  global.fetch = jest.fn(() =>
    Promise.resolve({
      text: () => Promise.resolve('<div>mock</div>'),
    })
  );

  jest.isolateModules(() => {
    require('../nav.js');
  });

  await Promise.resolve();
});

test('toggles navigation classes on click', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle.click();

  expect(navLinks.classList.contains('nav-open')).toBe(true);
  expect(navToggle.classList.contains('open')).toBe(true);
  expect(navToggle.getAttribute('aria-expanded')).toBe('true');
});
