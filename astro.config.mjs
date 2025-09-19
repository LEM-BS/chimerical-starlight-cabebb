import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lembuildingsurveying.co.uk',
  output: 'static',
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
