import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const site = 'https://www.lembuildingsurveying.co.uk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'src', 'pages');
const outputPath = path.join(repoRoot, 'public', 'sitemap.xml');

const skipFiles = new Set(['404.astro']);

const now = new Date().toISOString().slice(0, 10);

const entries = await fs.readdir(pagesDir, { withFileTypes: true });
const astroFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.astro') && !skipFiles.has(entry.name))
  .map((entry) => entry.name);

const urls = astroFiles.map((filename) => {
  const baseName = filename.replace(/\.astro$/, '');
  if (baseName === 'index') {
    return `${site}/`;
  }
  return `${site}/${baseName}.html`;
});

const sortedUrls = urls.sort((a, b) => a.localeCompare(b));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedUrls
  .map((url) => `  <url><loc>${url}</loc><lastmod>${now}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`;

await fs.writeFile(outputPath, xml, 'utf8');

console.log(`Wrote ${outputPath} with ${sortedUrls.length} URLs`);
