import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.lembuildingsurveying.co.uk',
  output: 'static',
  build: {
    format: 'directory'
  },
  vite: {
    build: {
      minify: 'terser',
      cssMinify: 'lightningcss'
    }
  }
});
