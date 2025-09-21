# Services Migration (Content Collections)

1. Audit every service entry currently stored in `src/pages/services*.astro` and `src/content/services` to build a canonical list of slugs, headings, hero assets, CTA text, and schema requirements.
2. Create a dedicated content collection (`src/content/services`) with a schema that covers shared metadata (title, description, excerpt, hero image, CTA copy, brochure links, FAQ toggles) and define any optional fields for specialised services.
3. Convert each legacy service page into a Markdown or MDX entry inside the collection, porting copy blocks, feature lists, pricing tables, and structured data snippets while stripping layout chrome.
4. Replace the existing page-level imports with `getCollection('services')`, update the services index (`/services`) to read from the collection, and ensure location pages pull service highlights from the same dataset.
5. Wire up CMS or spreadsheet feeds (if applicable) to mirror the new collection shape, adding validation around slugs, category tags, and last-reviewed dates so editors can bulk update entries safely.
6. Run `npm run build`, `npm run check`, and the relevant content tests to confirm schema validation passes, the services listing renders correctly, and there are no missing assets or broken internal links.
7. Prepare deployment notes outlining new collection usage, emphasising how to add or update services through the content layer, and circulate the instructions to delivery and SEO leads.

## Aftercare

- Monitor production for 404s or orphaned services, updating redirects for any retired slugs.
- Spot-check schema markup (Service, FAQPage, BreadcrumbList) using Google’s Rich Results test after deployment.
- Schedule a follow-up review with editors to confirm they can create and update service entries without developer input.
- Keep a changelog of service additions or taxonomy updates so the CRM, enquiry forms, and PPC landing pages stay aligned.
