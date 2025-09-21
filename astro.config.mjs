import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.lembuildingsurveying.co.uk',
  output: 'static',
  integrations: [react()],
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
