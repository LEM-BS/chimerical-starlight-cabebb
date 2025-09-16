import { expect, test } from 'vitest';

import { parseLegacyHtml } from '../src/utils/legacy';

test('removes legacy placeholders and scripts from body content', () => {
  const html = `
    <html>
      <head></head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        <div id="header-include"></div>
        <header class="site-header">Legacy Header</header>
        <main>
          <p>Modern content</p>
        </main>
        <div id="footer-include"></div>
        <footer>Legacy Footer</footer>
        <script src="/nav.js"></script>
        <script>include('header.html');</script>
        <script src="./assets/legacy.js"></script>
      </body>
    </html>
  `;

  const result = parseLegacyHtml(html);

  expect(result.body).toContain('<main>');
  expect(result.body).toContain('Modern content');
  expect(result.body).not.toMatch(/skip-link/);
  expect(result.body).not.toMatch(/header-include/);
  expect(result.body).not.toMatch(/footer-include/);
  expect(result.body).not.toMatch(/<header[\s\S]*site-header/);
  expect(result.body).not.toMatch(/<footer/);
  expect(result.body).not.toMatch(/nav\.js/);
  expect(result.body).not.toMatch(/header\.html/);
  expect(result.body).not.toMatch(/assets\/legacy\.js/);
});

test('removes legacy site header while keeping content headers', () => {
  const html = `
    <html>
      <head></head>
      <body>
        <header>
          <div class="header-inner">
            <nav class="main-nav">
              <a href="/">Home</a>
            </nav>
          </div>
        </header>
        <main>
          <header class="page-header">
            <h1>Keep me</h1>
          </header>
          <p>Useful content.</p>
        </main>
      </body>
    </html>
  `;

  const result = parseLegacyHtml(html);

  expect(result.body).toContain('class="page-header"');
  expect(result.body).toContain('Keep me');
  expect(result.body).toContain('Useful content');
  expect(result.body).not.toMatch(/header-inner/);
  expect(result.body).not.toMatch(/main-nav/);
});

test('injects testimonials snippet when placeholder is present', () => {
  const html = `
    <html>
      <head></head>
      <body>
        <section>
          <div id="testimonials-include"></div>
        </section>
      </body>
    </html>
  `;

  const testimonialsSnippet = `
    <div class="testimonials">
      <p>Great service!</p>
    </div>
  `;

  const result = parseLegacyHtml(html, {
    testimonialsSnippet,
  });

  expect(result.body).toContain('<div class="testimonials">');
  expect(result.body).toContain('Great service!');
  expect(result.body).not.toMatch(/testimonials-include/);
});

test('strips legacy head elements while preserving remaining head content', () => {
  const html = `
    <html>
      <head>
        <meta charset="utf-8">
        <link rel="stylesheet" href="styles.css">
        <link rel="icon" href="favicon.ico">
        <title>Modern Title</title>
        <script src="https://www.googletagmanager.com/gtag/js?id=123"></script>
      </head>
      <body><main></main></body>
    </html>
  `;

  const result = parseLegacyHtml(html);

  expect(result.head).toBe('<title>Modern Title</title>');
  expect(result.head).not.toMatch(/charset/);
  expect(result.head).not.toMatch(/stylesheet/);
  expect(result.head).not.toMatch(/icon/);
  expect(result.head).not.toMatch(/googletagmanager/);
});

test('ensures canonical and social URLs include the provided .html page URL', () => {
  const html = `
    <html>
      <head>
        <link rel="canonical" href="https://example.com/example">
        <meta property="og:url" content="https://example.com/example">
        <meta name="twitter:url" content="https://example.com/example">
      </head>
      <body></body>
    </html>
  `;

  const { head } = parseLegacyHtml(html, {
    pageUrl: 'https://example.com/example.html',
  });

  const matches = head.match(/https:\/\/example\.com\/example\.html/g) ?? [];

  expect(matches).toHaveLength(3);
  expect(head).not.toContain('https://example.com/example"');
});
