# Decisions

A running log of decisions that aren't obvious from the code. Newest first. Each one gives the date, the decision, why, and the alternatives considered.

## 2026-10-04 · Hosting on Vercel, data on Supabase, media on Cloudflare
- **Decision:** Vercel serves the site and gives every PR a preview URL. Supabase (Postgres with row-level security, plus Auth) holds data that people send *to* the site: reader corrections, reviewer accounts and the review queue. Cloudflare provides R2 for media, Turnstile for forms and DNS.
- **Why:** the maintainer already uses Vercel, and its Git integration gives PR previews without extra setup. Supabase covers what git can't: input from readers who have no GitHub account. R2 has no egress fees for large scans and images.
- **Not chosen:** keeping encyclopedia content in Supabase. Content stays as Markdown in git, so every change, especially AI-written ones, is a reviewable diff that passes the same validator.

## 2026-10-04 · Astro 7 with the unified Markdown processor
- **Decision:** `markdown.processor: unified({ remarkPlugins, rehypePlugins })` from `@astrojs/markdown-remark`.
- **Why:** Astro 7's default Sätteri pipeline has its own plugin API. The wikilink and script-language plugins are standard remark/rehype plugins, testable with `unified` directly.
- **Note:** Astro imports Sätteri at start-up even when it is unused. Its native binary was blocked by Windows Smart App Control on the maintainer's machine; Smart App Control has since been turned off there. CI and hosting run Linux and are unaffected.

## 2026-10-04 · `compressHTML: true` and inlined CSS
- **Decision:** use HTML whitespace rules, not Astro 7's default JSX rules, and set `build.inlineStylesheets: 'always'`.
- **Why:** prose templates rely on HTML whitespace. Inlining about 10 KB of CSS removes the render-blocking requests (Lighthouse performance went from 58 to 98).

## 2026-10-04 · Self-subset fonts
- **Decision:** `scripts/fonts/subset-fonts.py` cuts Noto Serif and Noto Serif Display to Latin, Latin-1 and the IAST/ISO 15919 letters. It pins italic and Noto Serif Devanagari to weight 400. UI labels use the system font. The generated `public/fonts/` and `src/styles/fonts.css` are committed.
- **Why:** Fontsource ships all of Latin Extended (170–230 KB per style) to cover about 40 letters, so pages were downloading about 1.1 MB of fonts. The subsets total about 150 KB, and glyph coverage was checked with fontTools.
- **Re-run** the script when the font packages are upgraded.

## 2026-10-04 · Watermark as generated content in a system font
- **Decision:** the native-script name behind titles is CSS `::before` content in a system Devanagari font.
- **Why:** as real text it was read by axe (failing contrast) and counted as the page's largest paint, which then waited for a web font.

## 2026-10-04 · One schema module for Astro and the validator
- **Decision:** `src/lib/schemas.ts` exports `buildSchemas(ref)`. Astro passes `reference()`; the validator passes a slug check.
- **Why:** a single definition, and the validator can run full schema checks before Astro does, with friendlier messages.

## 2026-10-04 · `gurus` carry a kind
- **Decision:** each guru entry is `{ person, kind: diksha | shiksha | lineage }`. Where sources say only "teacher", seed content uses `shiksha`.
- **Why:** paramparās mix initiation, instruction and lineage succession (for example Rāmānuja and Yāmuna). Lineage graphs need to tell these apart.

## 2026-10-04 · Search aliases
- **Decision:** each entry page carries a hidden, weighted list of spelling variants: ASCII, IAST folded to common English (ś → sh), and Devanagari anusvāra spellings (शङ्कर / शंकर).
- **Why:** Pagefind matches tokens, so `shankara`, `śaṅkara`, `शङ्कर` and `शंकर` should all find Śaṅkara. Verified in the browser.

## 2026-10-04 · Content rules applied to the seed entries
- GRETIL e-texts say "for reference purposes only", so `readOnline` marks them `link-only` and the entries quote only single verses.
- **Claims left out for lack of a retrievable source:** the traditional identification of Bādarāyaṇa with Vyāsa, and the name *Gītopaniṣad*. Both are in the backlog as open questions.
- Britannica blocks automated fetching, so it is not cited.
- Where only one scholarly date was retrievable, it is shown as the scholarly view, not "the consensus".

## 2026-10-04 · Repository public from day one
- **Why:** content is CC BY-SA anyway. On the free GitHub plan, public repositories get branch protection and unlimited Actions minutes. Pages stay `noindex` until `launched: true` in `src/config/site.ts`.
