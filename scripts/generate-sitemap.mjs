import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const site = 'https://www.lembuildingsurveying.co.uk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'src', 'pages');
const outputPath = path.join(repoRoot, 'public', 'sitemap.xml');
const areasPath = path.join(repoRoot, 'src', 'data', 'areas.ts');

const skipFiles = new Set(['404.astro']);

const now = new Date().toISOString().slice(0, 10);

const areaSource = await fs.readFile(areasPath, 'utf8');
const areaSlugMatches = Array.from(areaSource.matchAll(/createAreaEntry\('([^']+)'/g));
const areaSlugs = new Set(areaSlugMatches.map((match) => match[1]));

const entries = await fs.readdir(pagesDir, { withFileTypes: true });
const astroFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.astro') && !skipFiles.has(entry.name))
  .map((entry) => entry.name);
const collectAstroFiles = async (dir, relativeDir = '') => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectAstroFiles(fullPath, relativePath)));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.astro')) {
      continue;
    }

    if (skipFiles.has(entry.name) || skipFiles.has(relativePath)) {
      continue;
    }

    files.push(relativePath);
  }

  return files;
};

const astroFiles = await collectAstroFiles(pagesDir);

const urls = astroFiles.map((relativePath) => {
  const baseName = relativePath.replace(/\.astro$/, '');
  if (baseName === 'index') {
    return `${site}/`;
  }
  if (areaSlugs.has(baseName)) {
    return `${site}/service-areas/${baseName}-damp-surveys-rics-home-surveys.html`;
  }
  return `${site}/${baseName}.html`;
  const normalizedPath = baseName.split(path.sep).join('/');
  return `${site}/${normalizedPath}.html`;
});

const sortedUrls = urls.sort((a, b) => a.localeCompare(b));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedUrls
  .map((url) => `  <url><loc>${url}</loc><lastmod>${now}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`;

await fs.writeFile(outputPath, xml, 'utf8');

console.log(`Wrote ${outputPath} with ${sortedUrls.length} URLs`);
