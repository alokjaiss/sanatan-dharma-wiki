# Feature backlog

The Feature Builder routine takes the first unchecked item. Big phases are better built interactively with the kickoff prompts in `MASTER_PROMPT.md` §10; this list holds the work queued for the phases to come. Each item states its goal and how to tell it is done.

## Small follow-ups

- [ ] **Keep footnotes out of search results.** Add `data-pagefind-ignore` to the GFM footnotes section with a small rehype plugin. *Done when* a search for "gita" no longer lists "Footnotes" as a sub-result.
- [ ] **Automate the font build.** Run `scripts/fonts/subset-fonts.py` in a CI job when `@fontsource-variable/*` versions change, and fail if the committed output differs. *Done when* bumping a font package without regenerating fails CI.
- [ ] **Show the review backlog on the home page.** A small "In preparation" counter of backlog items by collection. *Done when* the counts match `backlog/content.yaml`.

## Phase 2: CMS, corrections and media (Vercel · Supabase · Cloudflare)

- [ ] **Keystatic CMS** at `/keystatic`, in GitHub mode on Vercel, with `npm run check:cms` in CI. See MASTER_PROMPT §9, Phase 2, items 1–4.
- [ ] **Supabase project and schema.** `supabase/migrations/` with:
  - `corrections` (id, entry_slug, page_url, message, source_url, contact_email nullable, created_at, status), where the public may insert but not read, under RLS
  - `reviewer_applications` (id, name, email, field, affiliation, statement, created_at, status)

  Generate TypeScript types. *Done when* `get_advisors` reports no security warnings, and an anonymous insert succeeds while an anonymous select returns nothing.
- [ ] **Corrections form** on every entry, as a small island that posts to a Vercel function. The function verifies a Cloudflare Turnstile token, then inserts into Supabase with the service key, which is never sent to the browser. *Done when* a correction from the preview deployment appears in Supabase, and a submission without a token is rejected.
- [ ] **Reviewer accounts** with Supabase Auth. Approved reviewers can sign in and mark entries `human-reviewed` or `expert-verified` through the CMS, which opens a PR. *Done when* a test reviewer's change arrives as a PR with `reviewedBy` set.
- [ ] **Media on Cloudflare R2.** Create a bucket with a public custom domain, plus `scripts/upload-media.ts` that uploads a file and prints the URL for `image.src`. Only Wikimedia Commons public-domain or CC images, with credit and licence. *Done when* an R2 image renders on an entry page.
- [ ] **`/editorial/` dashboard** (noindex): AI drafts awaiting review, most-linked stubs, entries missing sections, and open corrections (count only, from Supabase at build time).
- [ ] **Vercel Web Analytics.**

## Phase 4: Discovery

- [ ] Guru-paramparā lineage graphs, per tradition and on person pages, with an accessible list fallback.
- [ ] A timeline that can show either traditional or academic dates.
- [ ] Canon hubs: the Vedic corpus tree (Veda → śākhā → Saṃhitā/Brāhmaṇa/Āraṇyaka/Upaniṣad), Purāṇas, Darśanas, Āgamas, and bhakti literatures by language.
- [ ] A script toggle (Devanagari ↔ IAST ↔ regional scripts) using `@indic-transliteration/sanscript`.
- [ ] A places map (MapLibre with OpenStreetMap), richer deity entries, a glossary with hover cards, and faceted filters.

## Phase 5: Primary-text reader

- [ ] A `verses` data collection, with import scripts for open e-texts that record licence and checksum, and verse permalinks. Start with the Bhagavad Gītā.

## Phase 6: Reach

- [ ] A Hindi edition (`/hi/`), a public JSON API, OG images, RSS, a "verse of the day" and a PWA.
