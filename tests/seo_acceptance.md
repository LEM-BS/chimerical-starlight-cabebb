# SEO Acceptance Checklist

This checklist covers the highest-priority actions from the 19 September 2025 audit. Run through the items below before handing work over for re-crawl or deployment.

## 1. Metadata

- Confirm every indexable template sets a `<title>` ≤ 60 characters once rendered. Use the helper in `scripts/build_fixes_spreadsheet.py` or inspect the generated HTML in `dist/`.
- Ensure each page exposes a self-referential `<link rel="canonical">` pointing to `https://www.lembuildingsurveying.co.uk/...` with a single hop redirect path.
- Verify meta descriptions exist and fall between 130–160 characters for the top converting pages (home, services, enquiry, privacy policy).

## 2. Structured data

- Validate the `LocalBusiness` block emitted by `src/layouts/BaseLayout.astro` plus any page-specific JSON-LD using Google’s Rich Results test.
- Location pages must include a `BreadcrumbList` tracing Home → Areas We Cover → Location.
- Service pages should declare either `Service` or `FAQPage` schema where applicable. Use the SEO spreadsheet to track gaps.

## 3. Internal linking

- Each location and service page should have ≥3 unique internal inlinks. The global `SiteLinks` component plus contextual links in copy should satisfy this – spot check a handful of pages with the “Links” tab in your crawler.
- Run a crawl (Screaming Frog, Sitebulb, etc.) and confirm the “Orphaned sitemap pages” report is clear or has documented exceptions.

## 4. Assets & performance

- Run `npm run build:assets` and inspect `public/assets` to confirm minified JS and CSS are generated.
- During a Lighthouse pass, check that CSS and JS bundles are served with `Content-Encoding: br` or `gzip` (requires server config) and are minified (look for `.min.css`/`.min.js`).

## 5. Redirects & status codes

- Populate `redirect_map.csv` with destinations for any remaining 4xx URLs, then import into your hosting platform.
- After deployment run `scripts/post_deploy_validator.py urls_to_check.txt` to spot check status codes and canonical headers.
- Crawl for broken images and confirm the `/logo-sticker.png` reference resolves (addresses the previous 404).

## 6. Documentation

- Update Search Console sitemaps if any URLs were removed or added.
- Record outstanding SEO work or copy requirements in the sprint board so junior devs can pick them up without re-running discovery.
