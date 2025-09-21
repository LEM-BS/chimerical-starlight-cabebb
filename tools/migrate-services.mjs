import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const pagesDir = path.join(repoRoot, 'src', 'pages');
const servicesContentDir = path.join(repoRoot, 'src', 'content', 'services');
const serviceWrapperFile = path.join(repoRoot, 'src', 'components', 'ServiceContent.astro');

const serviceSeoPattern = /createServiceSeo\s*\(/;
const serviceNamePattern = /serviceName\s*:/;

async function collectAstroFiles(dir, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? path.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) {
      const nested = await collectAstroFiles(path.join(dir, entry.name), relativePath);
      files.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.astro')) {
      files.push(relativePath.replace(/\\/g, '/'));
    }
  }

  return files;
}

function shouldProcess(content) {
  return serviceSeoPattern.test(content) && serviceNamePattern.test(content);
}

function needsWrapper(content) {
  return !content.includes('ServiceContent entry={entry}') || !content.includes("await getEntry('services'");
}

function createSlug(relativePath) {
  const withoutExtension = relativePath.replace(/\.astro$/, '').replace(/\\/g, '/');

  if (withoutExtension.endsWith('/index')) {
    return withoutExtension.slice(0, -('/index'.length));
  }

  if (withoutExtension === 'index') {
    return '';
  }

  return withoutExtension;
}

function toTitleCase(slug) {
  return slug
    .split('-')
    .map((segment) => (segment ? segment[0].toUpperCase() + segment.slice(1) : segment))
    .join(' ');
}

function matchPropertyValue(content, property) {
  const pattern = new RegExp(
    String.raw`${property}\s*:\s*(?:\`([\s\S]*?)\`|'([^']*)'|"([^"]*)")`,
  );
  const match = content.match(pattern);
  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? match[3] ?? null;
}

function extractServiceName(content, slug) {
  const value = matchPropertyValue(content, 'serviceName');
  if (value) {
    return value.trim();
  }

  const title = matchPropertyValue(content, 'title');
  if (title) {
    return title.trim();
  }

  const slugPart = slug.split('/').pop() ?? slug;
  return toTitleCase(slugPart.replace(/-/g, ' '));
}

function extractDescription(content) {
  const constPattern = /const\s+(?:serviceDescription|description)\s*=\s*(?:`([\s\S]*?)`|'([^']*)'|"([^"]*)");/;
  const constMatch = content.match(constPattern);
  if (constMatch) {
    return (constMatch[1] ?? constMatch[2] ?? constMatch[3] ?? '').trim();
  }

  const inline = matchPropertyValue(content, 'description');
  return inline ? inline.trim() : null;
}

function ensureLeadingSlash(value) {
  if (!value) {
    return value;
  }
  return value.startsWith('/') ? value : `/${value.replace(/^\/+/, '')}`;
}

function extractCanonical(content, slug) {
  const canonical = matchPropertyValue(content, 'canonicalPath');
  if (canonical) {
    return ensureLeadingSlash(canonical.trim());
  }

  const safeSlug = slug.replace(/(^\/+|\/$)/g, '');
  return safeSlug ? ensureLeadingSlash(safeSlug) : '/';
}

function yamlValue(value) {
  return JSON.stringify(value ?? '');
}

async function ensureMdxEntry({ slug, title, canonical, intro, astroPath }) {
  if (!slug) {
    return;
  }

  const mdxPath = path.join(servicesContentDir, `${slug}.mdx`);
  const mdxDir = path.dirname(mdxPath);
  await fs.mkdir(mdxDir, { recursive: true });

  try {
    await fs.access(mdxPath);
    return;
  } catch (error) {
    if (error && error.code !== 'ENOENT') {
      throw error;
    }
  }

  const lines = ['---'];
  lines.push(`title: ${yamlValue(title)}`);
  lines.push(`slug: ${yamlValue(slug)}`);
  lines.push(`canonical: ${yamlValue(canonical)}`);
  if (intro) {
    lines.push(`intro: ${yamlValue(intro)}`);
  }
  lines.push('---', '');
  lines.push(`<!-- TODO: migrate content from src/pages/${astroPath}.astro -->`);
  lines.push('');
  lines.push('Replace this placeholder with service content.');
  lines.push('');

  await fs.writeFile(mdxPath, lines.join('\n'), 'utf8');
}

function addImportBlock(frontmatter, importLine) {
  if (frontmatter.includes(importLine)) {
    return frontmatter;
  }

  const importRegex = /^import\s.+$/gm;
  let lastImportIndex = -1;
  let match;
  while ((match = importRegex.exec(frontmatter)) !== null) {
    lastImportIndex = match.index + match[0].length;
  }

  if (lastImportIndex >= 0) {
    return (
      frontmatter.slice(0, lastImportIndex) +
      `\n${importLine}` +
      frontmatter.slice(lastImportIndex)
    );
  }

  if (frontmatter.trim().length === 0) {
    return `${importLine}\n`;
  }

  return `${importLine}\n${frontmatter}`;
}

function ensureAstroContentImport(frontmatter) {
  const astroImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['\"]astro:content['\"];?/m;
  const match = frontmatter.match(astroImportRegex);

  if (match) {
    const imports = match[1]
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!imports.includes('getEntry')) {
      imports.push('getEntry');
      const replacement = `import { ${imports.join(', ')} } from 'astro:content';`;
      return frontmatter.replace(astroImportRegex, replacement);
    }

    return frontmatter;
  }

  return addImportBlock(frontmatter, "import { getEntry } from 'astro:content';");
}

function appendLines(block, lines) {
  const trimmed = block.replace(/\s*$/, '');
  return `${trimmed}\n${lines.join('\n')}\n`;
}

function ensureEntrySnippet(frontmatter, slug) {
  if (/await\s+getEntry\(\s*['\"]services['\"]/m.test(frontmatter)) {
    if (!/const\s*{\s*Content\s*}\s*=\s*await\s*entry\.render\(\)/.test(frontmatter)) {
      return appendLines(frontmatter, ['const { Content } = await entry.render();']);
    }

    return frontmatter;
  }

  return appendLines(frontmatter, [
    `const entry = await getEntry('services', '${slug}');`,
    'const { Content } = await entry.render();',
  ]);
}

function normaliseImportPath(filePath) {
  if (!filePath.startsWith('.')) {
    return `./${filePath}`;
  }
  return filePath;
}

function rewriteFrontmatter(source, slug, importPath) {
  const frontmatterMatch = source.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return source;
  }

  const originalBlock = frontmatterMatch[1];
  let updated = originalBlock;

  updated = addImportBlock(updated, `import ServiceContent from '${importPath}';`);
  updated = ensureAstroContentImport(updated);
  updated = ensureEntrySnippet(updated, slug);

  if (!updated.endsWith('\n')) {
    updated += '\n';
  }

  const newFrontmatter = `---\n${updated}---`;
  return source.replace(/^---\n([\s\S]*?)\n---/, newFrontmatter);
}

function ensureWrapperMarkup(source) {
  if (/ServiceContent\s+entry=\{entry\}/.test(source)) {
    return source;
  }

  const baseLayoutMatch = source.match(/<BaseLayout[^>]*>/);
  const wrapperMarkup =
    '\n\n  <ServiceContent entry={entry}>\n    <Content />\n  </ServiceContent>\n';

  if (!baseLayoutMatch) {
    return `${wrapperMarkup}\n${source}`;
  }

  const start = baseLayoutMatch.index + baseLayoutMatch[0].length;
  return (
    source.slice(0, start) +
    wrapperMarkup +
    source.slice(start)
  );
}

function toImportPath(fromFile) {
  const fromDir = path.dirname(fromFile);
  let relativePath = path.relative(fromDir, serviceWrapperFile).replace(/\\/g, '/');
  relativePath = normaliseImportPath(relativePath);
  return relativePath;
}

async function processFile(relativePath) {
  const absolutePath = path.join(pagesDir, relativePath);
  const original = await fs.readFile(absolutePath, 'utf8');

  if (!shouldProcess(original)) {
    return;
  }

  const slug = createSlug(relativePath);
  const canonical = extractCanonical(original, slug);
  const title = extractServiceName(original, slug);
  const intro = extractDescription(original);

  await ensureMdxEntry({
    slug,
    title,
    canonical,
    intro,
    astroPath: relativePath.replace(/\.astro$/, ''),
  });

  if (!needsWrapper(original)) {
    return;
  }

  const importPath = toImportPath(absolutePath);
  let updated = rewriteFrontmatter(original, slug, importPath);
  updated = ensureWrapperMarkup(updated);

  if (updated !== original) {
    await fs.writeFile(absolutePath, updated, 'utf8');
  }
}

async function run() {
  const files = await collectAstroFiles(pagesDir);
  await Promise.all(files.map((file) => processFile(file)));
}

run().catch((error) => {
  console.error('Failed to migrate service pages:', error);
  process.exitCode = 1;
});
