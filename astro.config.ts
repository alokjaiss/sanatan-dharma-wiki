import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site';
import { rehypeScriptLang } from './src/lib/rehype-script-lang';
import { remarkWikilinks } from './src/lib/remark-wikilinks';

export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  // Astro 7 defaults to JSX whitespace rules; prose templates need HTML rules.
  compressHTML: true,
  // Pages carry ~10 KB of CSS; inlining it removes render-blocking requests.
  build: { inlineStylesheets: 'always' },
  integrations: [sitemap()],
  markdown: {
    // Astro 7 defaults to the Sätteri pipeline; our remark plugins need unified.
    processor: unified({
      gfm: true,
      smartypants: true,
      remarkPlugins: [remarkWikilinks],
      rehypePlugins: [rehypeScriptLang],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
