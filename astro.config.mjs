import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.lembuildingsurveying.co.uk',
  output: 'static',
  integrations: [mdx()],
  build: {
    format: 'file'
  },
  vite: {
    build: {
      minify: 'terser',
      cssMinify: 'lightningcss'
    }
  }
});
