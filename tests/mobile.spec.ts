import { expect, test } from '@playwright/test';
import { mkdir } from 'fs/promises';
import path from 'node:path';

const VIEWPORTS = [
  { width: 360, height: 780 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
] as const;

const PAGES = [
  { slug: '/', name: 'home' },
  { slug: '/services', name: 'services' },
  { slug: '/flint', name: 'case-study-flint' },
] as const;

const SCREENSHOT_DIR = path.join('tests', '__screenshots__');

test.beforeAll(async () => {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
});

for (const pageConfig of PAGES) {
  for (const viewport of VIEWPORTS) {
    test(`${pageConfig.name} has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(pageConfig.slug, { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle');

      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth:
          document.scrollingElement?.scrollWidth ?? document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));

      expect(scrollWidth, 'document should not overflow horizontally').toBeLessThanOrEqual(
        innerWidth,
      );

      const screenshotPath = path.join(
        SCREENSHOT_DIR,
        `${pageConfig.name}-${viewport.width}.png`,
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
    });
  }
}
