import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const site = 'https://www.lembuildingsurveying.co.uk';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'src', 'pages');
const outputPath = path.join(repoRoot, 'public', 'sitemap.xml');
const areasPath = path.join(repoRoot, 'src', 'data', 'areas.ts');

const skipFiles = new Set(['404.astro']);

const noindexPatterns = [
  /robots\s*:\s*{[\s\S]*?\bindex\s*:\s*false\b/i,
  /robots\s*:\s*\[[\s\S]*?['"]noindex['"][\s\S]*?\]/i,
  /<meta[^>]*name=["']robots["'][^>]*noindex/i,
  /<meta[^>]*noindex[^>]*name=["']robots["']/i,
];

const isNoindexPage = async (relativePath) => {
  const pagePath = path.join(pagesDir, relativePath);
  const contents = await fs.readFile(pagePath, 'utf8');
  return noindexPatterns.some((pattern) => pattern.test(contents));
};

const execFileAsync = promisify(execFile);
const today = new Date();

const formatDate = (date) => date.toISOString().slice(0, 10);

const clampToToday = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return formatDate(today);
  }

  if (date.getTime() > today.getTime()) {
    return formatDate(today);
  }

  return formatDate(date);
};

const getGitLastModified = async (relativePath) => {
  try {
    const filePath = path.join('src', 'pages', relativePath);
    const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cs', filePath], {
      cwd: repoRoot,
    });
    const trimmed = stdout.trim();
    if (trimmed) {
      return new Date(`${trimmed}T00:00:00Z`);
    }
  } catch (error) {
    // Ignore git errors (e.g., file not committed yet) and fall back to fs stats.
  }
  return undefined;
};

const getLastModifiedDate = async (relativePath) => {
  const gitDate = await getGitLastModified(relativePath);
  if (gitDate) {
    return clampToToday(gitDate);
  }

  try {
    const pagePath = path.join(pagesDir, relativePath);
    const stats = await fs.stat(pagePath);
    return clampToToday(stats.mtime);
  } catch (error) {
    // If we cannot determine a meaningful timestamp, fall back to today's date.
    return formatDate(today);
  }
};

const areaSource = await fs.readFile(areasPath, 'utf8');
const areaSlugMatches = Array.from(areaSource.matchAll(/createAreaEntry\('([^']+)'/g));
const areaSlugs = new Set(areaSlugMatches.map((match) => match[1]));

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

const includableFiles = [];
const excludedNoindexFiles = [];

for (const relativePath of astroFiles) {
  if (await isNoindexPage(relativePath)) {
    excludedNoindexFiles.push(relativePath);
    continue;
  }
  includableFiles.push(relativePath);
}

if (excludedNoindexFiles.length > 0) {
  console.log(
    `Skipping ${excludedNoindexFiles.length} noindex page(s): ${excludedNoindexFiles
      .map((file) => file.replace(/\.astro$/, ''))
      .join(', ')}`,
  );
}

const urls = await Promise.all(
  includableFiles.map(async (relativePath) => {
    const baseName = relativePath.replace(/\.astro$/, '');
    const slug = path.basename(baseName);
    let url;
    if (baseName === 'index') {
      url = `${site}/`;
    } else if (areaSlugs.has(slug)) {
      url = `${site}/${slug}-damp-surveys`;
    } else {
      const normalizedPath = baseName.split(path.sep).join('/');
      url = `${site}/${normalizedPath}`;
    }

    const lastmod = await getLastModifiedDate(relativePath);
    return { url, lastmod };
  }),
);

const sortedUrls = urls.sort((a, b) => a.url.localeCompare(b.url));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sortedUrls
  .map(({ url, lastmod }) => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod></url>`)
  .join('\n')}\n</urlset>\n`;

await fs.writeFile(outputPath, xml, 'utf8');

console.log(`Wrote ${outputPath} with ${sortedUrls.length} URLs`);
