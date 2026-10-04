# Sanatan Dharma Wiki

An open, source-cited encyclopedia of Sanātana Dharma: texts, authors, ācāryas, traditions and teachings. The full plan is in `MASTER_PROMPT.md`. Read it before structural work. Read `docs/CONTENT_GUIDE.md` before writing any content.

## Commands

```bash
npm run dev                          # http://localhost:4321 (search needs a build)
npm run validate                     # integrity checks (MASTER_PROMPT.md §8); also runs before build
npm test                             # Vitest
npm run check                        # astro check (types)
npm run lint
npm run build                        # validate → astro build → pagefind
npm run preview                      # serve dist/ (search works here)
npm run new -- <collection> <slug> [--stub] [--title "Title"]
```

CI runs validate → test → check → lint → build on every PR. `main` is protected.

## Repo map

- `src/content/<collection>/<slug>.md`: one entry per file. The collections are texts, people, traditions, concepts, places and deities.
- `src/lib/schemas.ts`: Zod schemas, the single source of truth for both Astro and the validator.
- `src/lib/schema-meta.ts`: enums, relation directions (`RELATIONS`) and article templates (`TEMPLATES`).
- `src/lib/graph.ts`: computes every reverse relation (disciples, works, commentaries, …). Never hand-write these.
- `src/lib/validate.ts`: the validator. `src/lib/remark-wikilinks.ts`: `[[slug|label]]`.
- `src/components/`, `src/layouts/`, `src/pages/`: templates. UI strings go through `t()` in `src/i18n/`.
- `docs/`: CONTENT_GUIDE (editorial policy), SOURCES, DECISIONS (log every decision), ROUTINES.
- `backlog/content.yaml`: queue of entries to write; file order is priority. `backlog/features.md`: feature queue.
- `scripts/fonts/subset-fonts.py`: regenerates `public/fonts/` and `src/styles/fonts.css`.

## Infrastructure

- **Vercel** hosts the site, with a preview URL per PR.
- **Supabase** stores corrections and reviewer accounts (Phase 2).
- **Cloudflare** provides R2 for media, Turnstile and DNS (Phase 2).
- Secrets live only in Vercel and GitHub settings. `.env.example` lists the names.

## Non-negotiable content rules (full text: docs/CONTENT_GUIDE.md)

1. **Describe, attribute, don't adjudicate.** Present each tradition in its own terms. Critiques are attributed, never stated in our voice.
2. **Two views, labelled.** Traditional and academic positions go in separate places, each with a source.
3. **Report sacred narrative; don't judge it.** No "myth", and no miracles presented as history.
4. **No fabrication, ever:**
   - Never write a verse, mantra or quotation from memory. Copy it from a source retrieved in this session, and cite the edition and locator.
   - Never invent a citation, page, edition or URL. Cite only sources you opened.
   - If unsure, leave the claim out and list it under *Needs human check* in the PR. A gap is better than an error.
5. **Fairness.** No tradition is ranked above another. A practitioner and a scholar should both find the entry fair.
6. **Contested modern topics:** main positions, quality sources, no polemic, no party politics.
7. **No promotion; no living persons** until Phase 6.
8. **Don't encode contested theology as data.** Use prose with attribution.

## Copyright

- Reproduce only public-domain translations, and name the translator and year.
- GRETIL texts are "for reference only": quote short passages and set `license: link-only`.
- Images must be public domain or CC, with credit. No AI-generated images of deities or saints.

## Writing entries

- `npm run new` scaffolds a file. Placeholders in `<angle brackets>` fail validation outside drafts.
- Published entries need: ≥3 references (texts: ≥1 primary), the first three template H2s, `roman` and `native` names, and a summary of ≤280 characters.
- Quote YAML strings that contain `: `.
- Text must be NFC.
- Link first mentions with `[[slug]]`. Every target must exist; create a stub (`--stub`) and add it to the backlog.
- Agents set `verification: ai-draft`. Only people set `human-reviewed` or `expert-verified`.

## Git

- Conventional commits: `content:`, `feat:`, `fix:`, `docs:`, `chore:`, `audit:`.
- Branches: `content/<date>-<slug>`, `feat/<name>`, `audit/<date>`.
- One PR per routine run or feature.
- Never push to `main` directly. Never merge your own content PR.

## Environment gotchas

- Astro 7 uses the unified Markdown processor (see `astro.config.ts`). Remark and rehype plugins depend on it.
- In tool calls, `\uXXXX` escapes in file content get decoded into literal characters. Use `\p{Script=…}` or code points instead.
