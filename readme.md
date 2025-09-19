# LEM Building Surveying Ltd Website

This repository contains the marketing site for LEM Building Surveying Ltd, now powered by [Astro](https://astro.build/).

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` now runs a lightweight asset pipeline alongside the Astro dev server. The watcher compiles `src/scripts/nav.js` and `src/css/style.css` into minified bundles inside `public/assets/`. Pages live in `src/pages` and share a common layout that renders the global header, footer and sitewide internal-link block.

## Building

```bash
npm run build
```

`npm run build` runs the asset builder (`npm run build:assets`) before invoking `astro build`, producing minified CSS/JS in `public/assets/` and a static site in `dist/`. Deploy the contents of `dist/`. For Netlify, set the build command to `npm run build` and the publish directory to `dist`.

## Quality checks

- `npm run check` – static analysis via `astro check`
- `npm test` – runs unit tests and link checks with Vitest

## Commit conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/) when authoring git messages. Aim for the format `type(scope): summary` using one of the standard types (`feat`, `fix`, `docs`, `chore`, or `perf`). Keep the summary in the imperative mood and under 72 characters. Include additional context in the body if a change needs further explanation.
