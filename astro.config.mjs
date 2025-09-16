import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.lembuildingsurveying.co.uk',
  output: 'static',
  build: {
    format: 'file'
  }
});
