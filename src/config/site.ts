/**
 * Site-wide settings. Change a value here and it changes everywhere.
 */

// Flip to `true` at public launch. Until then every page is `noindex` and robots.txt disallows
// crawling. SITE_LAUNCHED=true overrides it for local SEO checks only.
const LAUNCHED = false;

export const site = {
  name: 'Sanatan Dharma Wiki',
  nativeName: 'सनातन धर्म',
  tagline: 'An open, source-cited encyclopedia of Sanātana Dharma',
  description:
    'The texts of Sanātana Dharma, their authors and commentators, the ācāryas and saints, their teachings and the traditions that carry them. Every claim is cited.',
  /** Canonical origin: SITE_URL if set, else Vercel's production domain, else local dev. */
  url:
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:4321'),
  launched: LAUNCHED || process.env.SITE_LAUNCHED === 'true',
  repo: {
    slug: 'alokjaiss/sanatan-dharma-wiki',
    url: 'https://github.com/alokjaiss/sanatan-dharma-wiki',
    branch: 'main',
  },
  license: {
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
} as const;
