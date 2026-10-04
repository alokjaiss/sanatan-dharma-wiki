import type { APIRoute } from 'astro';
import { site } from '../config/site';

/** Until launch, ask every crawler to stay away; afterwards, point them at the sitemap. */
export const GET: APIRoute = () => {
  const body = site.launched
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', site.url).toString()}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
