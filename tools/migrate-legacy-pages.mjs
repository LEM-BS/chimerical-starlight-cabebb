import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const legacyDir = path.join(repoRoot, "src", "legacy");
const pagesDir = path.join(repoRoot, "src", "pages");

const skipFiles = new Set([
  "testimonials-snippet.html",
  "faqs.html",
  "local-surveys.html",
]);

const testimonialsPath = path.join(legacyDir, "testimonials-snippet.html");
let testimonialsSnippet = "";
try {
  testimonialsSnippet = (await fs.readFile(testimonialsPath, "utf8")).trim();
} catch (error) {
  // ignore missing snippet file
}

function indentContent(content, indentSpaces) {
  const indent = " ".repeat(indentSpaces);
  return content
    .split("\n")
    .map((line) => (line.trim().length === 0 ? "" : indent + line))
    .join("\n");
}

function sanitizeHead(html) {
  const dom = new JSDOM(`<head>${html}</head>`);
  const { document } = dom.window;
  const removals = [
    "meta[charset]",
    'meta[name="viewport"]',
    'link[rel="preconnect"]',
    'link[href*="fonts.googleapis.com"]',
    'link[href*="fonts.gstatic.com"]',
    'link[href*="styles.css"]',
    'link[rel="preload"][href*="styles.css"]',
    'link[rel="icon"]',
    'link[href*="font-awesome"]',
    'script[src*="googletagmanager.com"]',
    'script[src*="web.cmp.usercentrics.eu"]',
    'script[src*="autoblocker"]',
  ];

  removals.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });

  document.querySelectorAll("script").forEach((script) => {
    const src = script.getAttribute("src");
    const content = script.textContent ?? "";

    if (!src && /gtag\s*\(/i.test(content)) {
      script.remove();
    }
  });

  Array.from(document.head.childNodes).forEach((node) => {
    if (node.nodeType === node.TEXT_NODE && node.textContent?.trim()) {
      node.remove();
    }
  });

  return document.head.innerHTML.trim();
}

function sanitizeBody(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;

  document
    .querySelectorAll("#header-include, #footer-include, a.skip-link")
    .forEach((el) => el.remove());

  document.querySelectorAll("header").forEach((el) => {
    if (el.classList.contains("site-header") || el.querySelector("nav")) {
      el.remove();
    }
  });

  if (testimonialsSnippet) {
    document.querySelectorAll("#testimonials-include").forEach((el) => {
      el.innerHTML = testimonialsSnippet;
    });
  }

  document.querySelectorAll("script").forEach((script) => {
    const src = script.getAttribute("src")?.trim();
    const content = script.textContent ?? "";
    const normalizedSrc = src?.replace(/^\.\//, "/") ?? "";

    const shouldRemoveBySrc =
      normalizedSrc.endsWith("/nav.js") ||
      normalizedSrc === "/nav.js" ||
      normalizedSrc.startsWith("assets/") ||
      normalizedSrc.includes("/assets/") ||
      normalizedSrc.includes("header.html") ||
      normalizedSrc.includes("footer.html") ||
      normalizedSrc.includes("testimonials-snippet.html");

    const shouldRemoveByContent =
      /header\.html|footer\.html|testimonials-snippet\.html/.test(content);

    if (shouldRemoveBySrc || shouldRemoveByContent) {
      script.remove();
    }
  });

  document
    .querySelectorAll(
      'link[rel="stylesheet"], link[href*="styles.css"], link[rel="icon"]',
    )
    .forEach((link) => link.remove());

  Array.from(document.body.childNodes).forEach((node) => {
    if (node.nodeType === node.TEXT_NODE) {
      node.remove();
    }
  });

  return document.body.innerHTML.trim();
}

async function migrateFile(fileName) {
  const legacyPath = path.join(legacyDir, fileName);
  const astroPath = path.join(pagesDir, fileName.replace(/\.html$/, ".astro"));
  const html = await fs.readFile(legacyPath, "utf8");

  const dom = new JSDOM(html);
  const { document } = dom.window;

  const headHtml = sanitizeHead(document.head?.innerHTML ?? "");
  const bodyHtml = sanitizeBody(document.body?.innerHTML ?? html);

  const headSection = headHtml
    ? `  <Fragment slot="head">\n${indentContent(headHtml, 4)}\n  </Fragment>\n\n`
    : "";

  const bodySection = indentContent(bodyHtml, 2);

  const astroContent = `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\n---\n\n<BaseLayout>\n${headSection}${bodySection}\n</BaseLayout>\n`;

  await fs.writeFile(astroPath, astroContent, "utf8");
}

async function run() {
  let entries;

  try {
    entries = await fs.readdir(legacyDir);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn("Legacy directory not found; skipping migration.");
      return;
    }

    throw error;
  }

  const htmlFiles = entries.filter(
    (file) => file.endsWith(".html") && !skipFiles.has(file),
  );

  await Promise.all(htmlFiles.map((file) => migrateFile(file)));
}

run().catch((error) => {
  console.error("Failed to migrate legacy pages:", error);
  process.exitCode = 1;
});
