interface ParseOptions {
  testimonialsSnippet?: string;
}

const BODY_PLACEHOLDERS = [
  /<div\s+id="header-include"\s*><\/div>/gi,
  /<div\s+id="footer-include"\s*><\/div>/gi,
  /<div\s+id="header-include"\s*><\/div>\s*/gi,
  /<div\s+id="footer-include"\s*><\/div>\s*/gi,
  /<a\s+class="skip-link"[\s\S]*?<\/a>/gi,
  /<header[^>]*class=["']site-header["'][^>]*>[\s\S]*?<\/header>/gi,
  /<header[^>]*>[\s\S]*?<div[^>]*class=["'][^"']*header-inner[^"']*["'][^>]*>[\s\S]*?<\/header>/gi,
  /<footer[^>]*>[\s\S]*?<\/footer>/gi,
];

const NAV_SCRIPT_PATTERN = /<script[^>]*src="\/?nav\.js"[^>]*>\s*<\/script>/gi;
const INCLUDE_SCRIPT_PATTERN = /<script[^>]*>[\s\S]*?(header\.html|footer\.html|testimonials-snippet\.html)[\s\S]*?<\/script>/gi;
const ASSET_SCRIPT_PATTERN = /<script[^>]*src="(?:\.\/)??assets\/[^"]+"[^>]*>\s*<\/script>/gi;
const TESTIMONIALS_PLACEHOLDER_PATTERN = /<div\s+id="testimonials-include"\s*><\/div>/gi;

const HEAD_REMOVALS = [
  /<meta[^>]+charset[^>]*>/gi,
  /<meta[^>]+name=["']viewport["'][^>]*>/gi,
  /<link[^>]+rel=["']preconnect["'][^>]*googleapis[^>]*>/gi,
  /<link[^>]+rel=["']preconnect["'][^>]*gstatic[^>]*>/gi,
  /<link[^>]+href=["'][^"']*fonts\.googleapis\.com[^"']*["'][^>]*>/gi,
  /<link[^>]+rel=["']stylesheet["'][^>]*href=["'][^"']*styles\.css["'][^>]*>/gi,
  /<link[^>]+rel=["']stylesheet["'][^>]*href=["'][^"']*assets\/[^"]+["'][^>]*>/gi,
  /<link[^>]+rel=["']preload["'][^>]*styles\.css[^>]*>/gi,
  /<link[^>]+rel=["']icon["'][^>]*>/gi,
  /<link[^>]+font-awesome[^>]*>/gi,
  /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js[^>]*>\s*<\/script>/gi,
  /<script[^>]*>[\s\S]*?gtag\([\s\S]*?<\/script>/gi,
  /<script[^>]+src=["']https:\/\/web\.cmp\.usercentrics\.eu\/modules\/autoblocker\.js["'][^>]*>\s*<\/script>/gi,
  /<script[^>]+src=["']https:\/\/web\.cmp\.usercentrics\.eu\/ui\/loader\.js["'][^>]*>\s*<\/script>/gi,
];

const WHITESPACE_PATTERN = /\s+$/;

export function parseLegacyHtml(html: string, options: ParseOptions = {}) {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  let headContent = headMatch ? headMatch[1].trim() : '';

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1].trim() : html;

  for (const pattern of BODY_PLACEHOLDERS) {
    bodyContent = bodyContent.replace(pattern, '');
  }

  const testimonialsSnippet = options.testimonialsSnippet?.trim();
  bodyContent = bodyContent.replace(
    TESTIMONIALS_PLACEHOLDER_PATTERN,
    testimonialsSnippet ?? ''
  );

  bodyContent = bodyContent
    .replace(NAV_SCRIPT_PATTERN, '')
    .replace(INCLUDE_SCRIPT_PATTERN, '')
    .replace(ASSET_SCRIPT_PATTERN, '')
    .trim();

  for (const pattern of HEAD_REMOVALS) {
    headContent = headContent.replace(pattern, '');
  }

  headContent = headContent.replace(WHITESPACE_PATTERN, '').trim();

  return {
    head: headContent,
    body: bodyContent,
  };
}
