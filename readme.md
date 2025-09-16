# LEM Building Surveying Ltd Website

This repository contains the marketing site for LEM Building Surveying Ltd, now powered by [Astro](https://astro.build/).

## Getting started

```bash
npm install
npm run dev
```

The development server runs on <http://localhost:4321>. Pages live in `src/pages` and share a common layout that renders the global header and footer.

## Building

```bash
npm run build
```

The static build is generated in `dist/`. Deploy the contents of this directory. For Netlify, set the build command to `astro build` and the publish directory to `dist`.

## Quality checks

- `npm run check` – static analysis via `astro check`
- `npm test` – runs unit tests and link checks with Vitest
