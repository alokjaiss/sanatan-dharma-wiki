import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  // Astro 7 defaults to JSX whitespace rules; prose templates need HTML rules.
  compressHTML: true,
  integrations: [sitemap()],
  markdown: {
    // Astro 7 defaults to the Sätteri pipeline; our remark plugins need unified.
    processor: unified({ gfm: true, smartypants: true }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
