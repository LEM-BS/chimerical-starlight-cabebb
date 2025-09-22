import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://www.lembuildingsurveying.co.uk',
  output: 'static',
  integrations: [mdx(), react()],
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
