const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..', 'src', 'legacy');
const baseUrl = 'https://www.lembuildingsurveying.co.uk';

const titleOverrides = {
  'connahs-quay': 'Connah’s Quay',
};

const serviceConfigs = {
  services: { name: 'Services' },
  'additional-services': { name: 'Additional Services', parent: { name: 'Services', path: '/services' } },
  'rics-home-surveys': { name: 'RICS Home Surveys', parent: { name: 'Services', path: '/services' } },
  'damp-mould-surveys': { name: 'Damp & Mould Surveys', parent: { name: 'Services', path: '/services' } },
  'damp-timber-surveys': { name: 'Damp & Timber Surveys', parent: { name: 'Services', path: '/services' } },
  'measured-surveys': { name: 'Measured Surveys & Floorplans', parent: { name: 'Services', path: '/services' } },
  'epc-with-floorplans': { name: 'EPCs with Floorplans', parent: { name: 'Services', path: '/services' } },
  'ventilation-assessments': { name: 'Ventilation Assessments', parent: { name: 'Services', path: '/services' } },
  'local-surveys': { name: 'Areas We Cover' },
};

const locationExtras = new Set(['north-west-of-england']);

const lowerCaseWords = new Set(['and', 'or', 'of', 'the', 'in', 'for', 'with', 'to']);

function toTitleCase(slug) {
  const parts = slug.split('-');
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0 && lowerCaseWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function buildBreadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function formatScriptTag(json) {
  const jsonString = JSON.stringify(json, null, 2);
  const indentedJson = jsonString
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n');
  return `\n  <script type="application/ld+json">\n${indentedJson}\n  </script>`;
}

function getCanonicalUrl(html) {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i);
  return canonicalMatch ? canonicalMatch[1] : null;
}

function ensureTrailingSlash(url) {
  return url.endsWith('/') ? url : `${url}/`;
}

function insertAfterFirstJsonLd(html, scriptTag) {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i;
  const match = html.match(jsonLdRegex);
  if (!match) {
    return null;
  }
  const insertPos = match.index + match[0].length;
  return html.slice(0, insertPos) + scriptTag + html.slice(insertPos);
}

function insertBeforeHeadClose(html, scriptTag) {
  const headCloseIndex = html.search(/<\/head>/i);
  if (headCloseIndex === -1) {
    return null;
  }
  return html.slice(0, headCloseIndex) + scriptTag + '\n' + html.slice(headCloseIndex);
}

function updateLocationBreadcrumb(fileName) {
  const filePath = path.join(baseDir, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('"@type": "BreadcrumbList"')) {
    return false;
  }

  const canonical = getCanonicalUrl(html) || `${baseUrl}/${path.basename(fileName, '.html')}`;
  const slug = canonical.replace(baseUrl, '').replace(/(^\/+|\/$)/g, '') || path.basename(fileName, '.html');
  const locationSlug = slug || path.basename(fileName, '.html');
  const name = titleOverrides[locationSlug] || toTitleCase(locationSlug);
  const breadcrumb = buildBreadcrumb([
    { name: 'Home', item: ensureTrailingSlash(baseUrl) },
    { name: 'Areas We Cover', item: `${baseUrl}/local-surveys` },
    { name, item: canonical },
  ]);

  const scriptTag = formatScriptTag(breadcrumb);
  let updated = insertAfterFirstJsonLd(html, scriptTag);
  if (!updated) {
    updated = insertBeforeHeadClose(html, scriptTag);
  }
  if (!updated) {
    throw new Error(`Could not insert breadcrumb script into ${fileName}`);
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function updateServiceBreadcrumb(fileName, config) {
  const filePath = path.join(baseDir, fileName);
  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('"@type": "BreadcrumbList"')) {
    return false;
  }

  const canonical = getCanonicalUrl(html) || `${baseUrl}/${path.basename(fileName, '.html')}`;
  const items = [{ name: 'Home', item: ensureTrailingSlash(baseUrl) }];
  if (config.parent) {
    items.push({ name: config.parent.name, item: `${baseUrl}${config.parent.path}` });
  }
  items.push({ name: config.name, item: canonical });
  const breadcrumb = buildBreadcrumb(items);
  const scriptTag = formatScriptTag(breadcrumb);
  let updated = insertAfterFirstJsonLd(html, scriptTag);
  if (!updated) {
    updated = insertBeforeHeadClose(html, scriptTag);
  }
  if (!updated) {
    throw new Error(`Could not insert breadcrumb script into ${fileName}`);
  }
  fs.writeFileSync(filePath, updated, 'utf8');
  return true;
}

function main() {
  const files = fs.readdirSync(baseDir).filter((file) => file.endsWith('.html'));
  const locationFiles = files.filter((file) => {
    if (file === 'local-surveys.html') {
      return false;
    }
    const fullPath = path.join(baseDir, file);
    const html = fs.readFileSync(fullPath, 'utf8');
    return html.includes('"addressLocality"');
  });

  locationExtras.forEach((extra) => {
    const candidate = `${extra}.html`;
    if (files.includes(candidate) && !locationFiles.includes(candidate)) {
      locationFiles.push(candidate);
    }
  });

  let updatedCount = 0;
  for (const file of locationFiles) {
    if (updateLocationBreadcrumb(file)) {
      updatedCount += 1;
    }
  }

  for (const [slug, config] of Object.entries(serviceConfigs)) {
    const fileName = `${slug}.html`;
    if (!files.includes(fileName)) {
      continue;
    }
    if (updateServiceBreadcrumb(fileName, config)) {
      updatedCount += 1;
    }
  }

  console.log(`Updated ${updatedCount} files with breadcrumb structured data.`);
}

main();
