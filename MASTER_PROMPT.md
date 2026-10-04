# Sanatan Dharma Wiki: Master Build Prompt

*Version 1 · 2026-10-04*

An open, source-cited encyclopedia of **Sanātana Dharma**: the original texts, their authors and commentators, the ṛṣis, ācāryas and saints, their teachings, the traditions that carry them, and the places where they live on. Built in phases, then grown continuously by scheduled AI agents. A human reviews every change before it goes live.

**How to use this file**

1. Review §0 and change any default you disagree with. Everything else follows from it.
2. Open Claude Code in this folder and paste the **Phase 1 kickoff** from §10.
3. After each phase: review, merge, then paste the next kickoff. After Phase 3, create the routines in §11 with `/schedule`.
4. This file stays the source of truth. When a decision changes, change it here and in `docs/DECISIONS.md` so every future agent sees it.

---

## 0. Decisions (defaults, edit before Phase 1)

| Decision | Default | Notes |
|---|---|---|
| Working name | **Sanatan Dharma Wiki** | Alternative: *Sanātana Kośa* (सनातन कोश). Set once in `src/config/site.ts`. |
| Stack | Astro · Markdown in git · Keystatic CMS · Pagefind · Tailwind | Rationale in §3 |
| Hosting | **Vercel** serves the site, with a preview deployment for every PR; `*.vercel.app` URL first, custom domain before launch | Decided 2026-10-04 (was Cloudflare) |
| Database | **Supabase** (Postgres + Auth) for data people send *to* the site: reader corrections, expert-reviewer accounts, review queue | Entries themselves stay Markdown in git, so every AI change remains a reviewable diff |
| Storage and edge | **Cloudflare**: R2 for images, manuscript scans and audio; Turnstile on public forms; DNS for the custom domain | |
| Repository | GitHub `alokjaiss/sanatan-dharma-wiki`, **public from day one** | On the free GitHub plan, only public repos get branch protection and unlimited Actions minutes. Content is openly licensed anyway. |
| Search engines | `noindex` everywhere until `launched: true` in site config | Lets you build in the open without being indexed |
| Language | English prose; every name also in IAST and native script; Hindi edition in Phase 6 | UI strings go through `t()` from day one |
| Licence | Original prose CC BY-SA 4.0 · code MIT | Quoted material keeps its own licence |
| Review model | Every AI-written change arrives as a PR; a human merges | Nothing auto-merges |
| Scope boundary | Historical figures and established traditions first; living persons and present-day organisations from Phase 6, with stricter sourcing | |

---

## 1. Mission and audience

**Mission:** the most trustworthy free reference on Sanātana Dharma. Every claim is cited and every tradition is described in its own terms. Traditional and academic views appear side by side, and readers can move freely between texts, teachers and traditions.

**Readers:** seekers and curious readers, students, practitioners exploring traditions beyond their own, and researchers who need a reliable starting point. Write for an educated general reader; gloss every technical term on first use.

**What makes it different:**

- **Relational.** A text links to its authors, its commentaries and the traditions that hold it authoritative. An ācārya links to gurus, disciples, works and institutions. The site computes these links from the data; nobody maintains them by hand.
- **Two views, as data.** Dates and attributions carry both the traditional and the academic position, each with its source.
- **Primary text first.** Every text entry points to the original text and to openly licensed translations.
- **Transparent.** Every page shows how it was written and how far it has been verified.

---

## 2. What the encyclopedia covers

| Collection | Covers | Examples |
|---|---|---|
| `texts` | Śruti, smṛti and later literature, including commentaries and vernacular scripture | Ṛgveda, Bṛhadāraṇyaka Upaniṣad, Bhagavad Gītā, Brahma Sūtra, Śrī Bhāṣya, Tēvāram, Rāmcaritmānas |
| `people` | Ṛṣis, ācāryas, commentators, saints, poet-saints, grammarians, figures of Itihāsa–Purāṇa | Vyāsa, Yājñavalkya, Ādi Śaṅkarācārya, Rāmānuja, Madhva, Abhinavagupta, Āṇṭāḷ, Tulsīdās |
| `traditions` | Darśanas, schools, sampradāyas, monastic orders, movements | Vedānta → Advaita / Viśiṣṭādvaita / Dvaita; Śaiva Siddhānta; Gauḍīya Vaiṣṇavism; Śrīkula; Daśanāmī order |
| `concepts` | Doctrines and key ideas, with each tradition's interpretation | dharma, karma, ātman, brahman, māyā, bhakti, mokṣa, ṛta |
| `places` | Maṭhas, pīṭhas, tīrthas, kṣetras, temples | Śṛṅgeri, Kāśī, Śrīraṅgam, Kāñcīpuram |
| `deities` | Deities (minimal in Phase 1, enriched in Phase 4) | Śiva, Viṣṇu, Devī, Gaṇeśa, Kṛṣṇa |
| `verses` *(Phase 5)* | Verse-level original text with word meanings and translations | Bhagavad Gītā, principal Upaniṣads, Yoga Sūtra |

**Order of work.** This order drives `backlog/content.yaml`, where position in the file is the priority.

- **Tier 1, foundations (~120 entries).** The four Vedas; the principal Upaniṣads; Rāmāyaṇa, Mahābhārata, Bhagavad Gītā; the foundational texts of the six darśanas (Nyāya Sūtra, Vaiśeṣika Sūtra, Sāṃkhya Kārikā, Yoga Sūtra, Mīmāṃsā Sūtra, Brahma Sūtra); the Bhāgavata, Viṣṇu, Śiva and Mārkaṇḍeya Purāṇas (with the Devī Māhātmya); their seers, authors and principal commentators; the six darśanas and the main Vedānta, Śaiva, Vaiṣṇava, Śākta and Smārta traditions; ~25 core concepts.
- **Tier 2, depth (~300).** All eighteen Mahāpurāṇas; Brāhmaṇas, Āraṇyakas, Vedāṅgas, Dharmaśāstras; principal Āgamas and Tantras; each school's commentaries on the prasthāna-traya; prakaraṇa texts; the great bhakti literatures in Tamil, Kannada, Marathi, Hindi, Bengali, Telugu and other languages; founders and leading ācāryas of each sampradāya; the āmnāya maṭhas, Jyotirliṅgas, Divya Deśams and Śakti Pīṭhas.
- **Tier 3, breadth.** The 108 Upaniṣads of the Muktikā canon, Upapurāṇas, stotra literature, regional saints, later commentators, festivals and observances.

---

## 3. Stack and architecture

| Concern | Choice | Why |
|---|---|---|
| Framework | Astro (latest stable), TypeScript strict | Content-first, static HTML, zero JS by default; content collections validate every entry at build |
| Content | One Markdown file per entry, YAML frontmatter, in `src/content/<collection>/` | Git gives history and reviewable diffs; agents can write Markdown safely (no JSX to break) |
| Schemas | Zod schemas in `src/content.config.ts` | Invalid content fails the build |
| Cross-links | `[[slug]]` and `[[slug\|label]]` wikilinks, resolved by a custom remark plugin | Fast to write; broken links caught at build |
| Citations | GFM footnotes in the body + a `references` list in frontmatter | Claim-level citations plus a bibliography |
| CMS | Keystatic: local mode in dev, GitHub mode in production | CMS edits become commits/PRs in the same repo, so humans and agents share one workflow |
| Search | Pagefind | Static index built after `astro build`; no server; scales to thousands of pages |
| Styling | Tailwind CSS + a small set of hand-built components | |
| Fonts | Self-hosted via Fontsource: a serif that renders every IAST character (check ṝ and ḹ; Noto Serif is the safe default), Noto Serif Devanagari or Tiro Devanagari Sanskrit (Vedic accents); other Indic scripts loaded only where used | |
| Transliteration | `@indic-transliteration/sanscript` (Phase 4) | Devanagari ↔ IAST ↔ regional scripts |
| Hosting | Vercel: static pages plus the few serverless routes Keystatic and the forms need; a preview deployment per PR | Global CDN, preview URLs for reviewing agent PRs |
| Database | Supabase: Postgres with row-level security, Supabase Auth for reviewers | Dynamic data only; content stays in git |
| Media and edge | Cloudflare R2 (media files, zero egress fees), Turnstile (bot protection on forms), DNS | |
| CI | GitHub Actions: validate → test → type-check → build on every PR | Humans and agents pass the same gates |

If Keystatic's GitHub mode can't run on the host, use Sveltia CMS (static admin, GitHub backend) and log the switch in `docs/DECISIONS.md`. Keystatic lacks built-in multi-locale editing, so revisit the CMS choice at the start of Phase 6.

**Architecture rules**

1. **Content is data.** Pages are generated from frontmatter; prose lives in the Markdown body.
2. **Every relation is stored once**, in the direction given in §5.3. Reverse views (disciples, works, commentaries, sub-traditions, "discussed in") are computed at build time in `src/lib/graph.ts`. Never hand-maintain a reverse list.
3. **Slugs** use the common ASCII spelling: drop diacritics, ś/ṣ → `sh`, ṛ → `ri`, c → `ch` (`rigveda`, `adi-shankaracharya`, `brahma-sutra-bhashya-shankara`). They are kebab-case and unique across *all* collections, so `[[slug]]` needs no prefix. A published slug never changes; if a rename is unavoidable, add a redirect.
4. **Static by default.** Client-side JS only for islands that need it (search, script toggle, graphs, filters), lazily hydrated.
5. **Accessible.** Semantic HTML, WCAG 2.2 AA, and every non-English string carries a `lang` attribute (`sa-Deva`, `sa-Latn`, `hi`, `ta`, …) for screen readers and correct font fallback.
6. **i18n-ready.** UI strings live in `src/i18n/en.ts`; the default locale is unprefixed so adding `/hi/` later changes no existing URL.

**Repository layout**

```
/
├── CLAUDE.md                     # standing rules for every AI session and agent
├── MASTER_PROMPT.md              # this file
├── docs/
│   ├── CONTENT_GUIDE.md          # §6 in full: editorial policy, style, templates
│   ├── SOURCES.md                # allowed sources by tier (§6.4)
│   ├── ROUTINES.md               # live copies of the routine prompts (§11)
│   └── DECISIONS.md              # decision log: date · decision · why · alternatives
├── backlog/
│   ├── content.yaml              # queue of entries to write; file order = priority
│   └── features.md               # queue of features; file order = priority
├── scripts/
│   ├── validate-content.ts       # integrity checks beyond Zod (§8)
│   ├── new-entry.ts              # npm run new -- texts katha-upanishad
│   └── migrations/               # one script per breaking schema change
├── src/
│   ├── content.config.ts
│   ├── content/{texts,people,traditions,concepts,places,deities}/*.md
│   ├── components/  layouts/  pages/  lib/  i18n/  config/
└── .github/
    ├── workflows/ci.yml
    ├── ISSUE_TEMPLATE/correction.yml
    └── pull_request_template.md
```

---

## 4. Information architecture

| URL | Page |
|---|---|
| `/` | Search-first home: browse cards per collection with counts; "Explore the canon" (Śruti · Smṛti · Darśanas · Āgamas & Tantras · Bhakti literature); recently added; featured |
| `/texts/` · `/texts/<slug>/` | Texts grouped by canon → genre, with filters (canon, genre, language, Veda, tradition) · text entry |
| `/people/` · `/people/<slug>/` | By role, tradition and century · person entry |
| `/traditions/` · `/traditions/<slug>/` | Tradition tree (by `parent`) · tradition entry |
| `/concepts/` · `/concepts/<slug>/` | A–Z · concept entry |
| `/places/` · `/places/<slug>/` | By kind and region · place entry |
| `/deities/` · `/deities/<slug>/` | A–Z · deity entry |
| `/search/` | Full search with type filters |
| `/about/` `/how-this-is-written/` `/editorial-policy/` `/transliteration/` `/sources/` `/contribute/` | Static pages |
| `/editorial/` *(Phase 2, noindex)* | Review dashboard |
| *Phase 4+* | `/lineages/<tradition>/`, `/timeline/`, `/map/`, `/glossary/` |
| *Phase 5* | `/texts/<slug>/<chapter>/` and `/texts/<slug>/<chapter>/<verse>/` |

**Entry page anatomy** (every collection)

1. Breadcrumbs (Texts › Mahābhārata › Bhagavad Gītā).
2. Title block: English title; IAST and native script beneath; one-line summary; verification badge linking to `/how-this-is-written/`; stub notice when `status: stub`.
3. Infobox (right column on wide screens, top on mobile), built only from frontmatter. Dating appears as two labelled rows, *Traditional* and *Academic*, each with its source.
4. Body with a sticky "On this page" table of contents.
5. Computed relations (§5.3). For a text: its commentaries, its contents and "authoritative in". For a person: the guru chain back to the earliest known teacher, plus disciples, works and places.
6. Footnotes, bibliography (from `references`), then "Read the text online" with licence labels.
7. Footer actions: *Edit this page* (CMS) · *Report an error* (prefilled GitHub issue) · last updated · licence.

---

## 5. Content model

### 5.1 Shared types and common fields

Notation below; implement with Zod and `reference()` in `src/content.config.ts`, using the current Astro content-collection APIs.

```ts
// ── Shared types ──────────────────────────────────────────────────────────────
type Slug   = string   // /^[a-z0-9]+(-[a-z0-9]+)*$/, unique across ALL collections
type Ref<C> = Slug     // Astro reference() to collection C
type Script = 'deva' | 'taml' | 'telu' | 'knda' | 'mlym' | 'beng' | 'gujr' | 'guru' | 'orya' | 'latn' // ISO 15924

type DateView = {
  label: string                  // what readers see: "c. 8th century CE"
  from?: number; to?: number     // for sorting and the timeline only; negative = BCE
  source: string                 // who holds this view: "Śṛṅgeri Maṭha tradition", "Olivelle 1998"
}
type Dating = { traditional: DateView[]; academic: DateView[]; note?: string }

type Reference = {
  kind: 'primary' | 'secondary' | 'tertiary' | 'traditional'   // traditional = a tradition's own account
  title: string; author?: string; year?: string; publisher?: string
  url?: string                   // only URLs actually opened while writing
  locator?: string               // chapter / page / verse, never invented
  note?: string
}

type Image = { src: string; alt: string; credit: string; license: string; sourceUrl: string } // PD or CC only

// ── Fields on every collection ────────────────────────────────────────────────
type Common = {
  title: string                  // common English form: "Bhagavad Gita"
  roman?: string                 // IAST for Sanskrit, ISO 15919 for other Indic languages: "Bhagavadgītā"
  native?: string                // native script: "भगवद्गीता"
  nativeScript: Script           // default 'deva'
  aliases: string[]              // every variant, incl. plain ASCII and native-script variants (शङ्कर / शंकर)
  summary: string                // ≤ 280 chars: cards, meta description, search snippet
  status: 'stub' | 'draft' | 'published'                       // draft is excluded from production builds
  verification: 'ai-draft' | 'human-reviewed' | 'expert-verified'
  reviewedBy?: string            // required when expert-verified
  featured: boolean              // default false
  concepts: Ref<'concepts'>[]    // (the concepts collection itself uses `related` instead)
  references: Reference[]        // published entries: ≥ 3, and ≥ 1 primary for texts
  image?: Image
  created: Date; updated: Date
}
```

### 5.2 Collections (each also has `Common`)

```ts
type Text = {
  genre: 'samhita' | 'brahmana' | 'aranyaka' | 'upanishad' | 'vedanga' | 'sutra' | 'karika'
       | 'itihasa' | 'purana' | 'upapurana' | 'dharmashastra' | 'agama' | 'tantra'
       | 'bhashya' | 'tika' | 'prakarana' | 'stotra' | 'kavya' | 'bhakti-poetry' | 'other'
  canon: 'shruti' | 'smriti' | 'other'   // conventional classification, for navigation only…
  canonNote?: string                     // …so record where traditions classify it differently
                                         //   (Śaiva Siddhānta holds the Āgamas as revealed; Śrīvaiṣṇavas
                                         //   revere the Nālāyira Divya Prabandham as the "Tamil Veda")
  languages: string[]                    // 'vedic-sanskrit', 'sanskrit', 'tamil', 'awadhi', …
  veda?: 'rigveda' | 'samaveda' | 'shukla-yajurveda' | 'krishna-yajurveda' | 'atharvaveda'
  shakha?: string                        // recension
  partOf?: Ref<'texts'>                  // bhagavad-gita → mahabharata
  order?: number                         // position within the parent (prev/next, trees)
  commentsOn?: Ref<'texts'>              // a bhāṣya or ṭīkā → its root text
  authorship: {
    person: Ref<'people'>
    role: 'author' | 'seer' | 'compiler' | 'redactor' | 'commentator' | 'translator'
    basis: 'traditional' | 'scholarly' | 'disputed'
    note?: string
  }[]
  authorshipNote?: string                // e.g. the apauruṣeya (authorless) view of the Vedas
  deities: Ref<'deities'>[]              // deities central to the text
  dating?: Dating
  structure?: string                     // "18 adhyāyas, 700 verses"
  readOnline: {
    label: string; url: string
    kind: 'original' | 'translation' | 'commentary'
    language: string
    license: 'public-domain' | 'open-license' | 'link-only'
  }[]
}

type Person = {
  roles: ('rishi' | 'acharya' | 'philosopher' | 'commentator' | 'saint' | 'poet' | 'guru'
        | 'grammarian' | 'scholar' | 'reformer' | 'patron' | 'itihasa-purana-figure' | 'other')[]
  traditions: Ref<'traditions'>[]
  gurus: {                               // disciples are computed, never stored
    person: Ref<'people'>
    kind: 'diksha' | 'shiksha' | 'lineage'   // initiating teacher · instructing teacher ·
                                             // predecessor in the paramparā without direct contact
    note?: string
  }[]
  dating?: Dating                        // lifespan or floruit
  birthplace?: Ref<'places'>
  region?: string                        // "Kerala", "Kashmir"
  languages: string[]
  living: boolean                        // default false; living persons out of scope until Phase 6
}

type Tradition = {
  kind: 'darshana' | 'school' | 'sampradaya' | 'sub-tradition' | 'monastic-order' | 'movement'
  parent?: Ref<'traditions'>             // advaita-vedanta → vedanta
  founders: Ref<'people'>[]              // founders or principal systematisers
  coreTexts: Ref<'texts'>[]              // ordered and curated, e.g. the prasthāna-traya
  deityFocus: Ref<'deities'>[]
  dating?: Dating                        // emergence
}

type Concept = {
  domain?: 'metaphysics' | 'epistemology' | 'ethics' | 'soteriology' | 'cosmology'
         | 'ritual' | 'practice' | 'social' | 'aesthetics' | 'other'
  related: Ref<'concepts'>[]             // displayed on both concepts
  interpretations: { tradition: Ref<'traditions'>; summary: string }[]   // one neutral paragraph each
}

type Place = {
  kind: 'matha' | 'peetha' | 'tirtha' | 'temple' | 'kshetra' | 'ashram'
      | 'city' | 'region' | 'river' | 'mountain' | 'other'
  tags: string[]                         // 'jyotirlinga', 'shakti-peetha', 'divya-desam', 'char-dham', 'amnaya-matha'
  location: { region: string; country: string; lat?: number; lng?: number }
  traditions: Ref<'traditions'>[]
  people: Ref<'people'>[]                // founders and associated figures
  dating?: Dating                        // founding or earliest attestation
}

type Deity = {                           // minimal until Phase 4
  related: Ref<'deities'>[]              // deliberately non-hierarchical (§6.1, rule 9)
}
```

### 5.3 Where each relation is stored

| Stored on | Field | Computed view |
|---|---|---|
| text | `partOf` | parent's **Contents**; prev/next among siblings |
| text | `commentsOn` | root text's **Commentaries** |
| text | `authorship[].person` | person's **Works** |
| text | `deities` | deity's **Texts** |
| person | `gurus[].person` | guru's **Disciples**; lineage chains and graphs |
| person | `traditions` | tradition's **Ācāryas and figures** |
| person | `birthplace` | place's **Born here** |
| tradition | `parent` | **Sub-traditions** |
| tradition | `founders` | person's **Founded** |
| tradition | `coreTexts` | text's **Authoritative in** |
| tradition | `deityFocus` | deity's **Traditions** |
| place | `traditions`, `people` | tradition's **Centres**; person's **Places** |
| any | `concepts` | concept's **Discussed in** |
| concept | `related` | shown on both concepts |
| concept | `interpretations[].tradition` | tradition's **Key doctrines** |

### 5.4 Example entry (format illustration; values in `<…>` must come from cited sources)

```markdown
---
title: Bhagavad Gita
roman: Bhagavadgītā
native: भगवद्गीता
nativeScript: deva
aliases: [Gita, Gītā, Bhagavadgita, Gitopanishad, श्रीमद्भगवद्गीता]
summary: A 700-verse dialogue between Kṛṣṇa and Arjuna set within the Mahābhārata, and one of the three foundational texts (prasthāna-traya) of Vedānta.
status: published
verification: ai-draft
genre: itihasa
canon: smriti
canonNote: Classed as smṛti, yet traditionally called an Upaniṣad (Gītopaniṣad) and counted among the prasthāna-traya.
languages: [sanskrit]
partOf: mahabharata
authorship:
  - { person: vyasa, role: author, basis: traditional }
deities: [krishna]
concepts: [dharma, karma, bhakti, atman, brahman]
dating:
  traditional:
    - { label: "<as stated by the cited traditional source>", source: "<source>" }
  academic:
    - { label: "<range from cited scholarship>", from: <year>, to: <year>, source: "<author year>" }
structure: 18 adhyāyas, 700 verses in the commonly transmitted text
references:
  - { kind: primary, title: "<e-text or edition you opened>", url: "<url>" }
  - { kind: secondary, title: "<book>", author: "<author>", year: "<year>", publisher: "<publisher>" }
  - { kind: tertiary, title: "<reference work>", url: "<url>" }
readOnline:
  - { label: "Sanskrit e-text", url: "<url>", kind: original, language: sanskrit, license: open-license }
created: 2026-10-04
updated: 2026-10-04
---

## Overview

The **Bhagavad Gita** (*Bhagavadgītā*; भगवद्गीता) is a dialogue between [[krishna|Kṛṣṇa]] and the
warrior Arjuna, set in the Bhīṣma Parva of the [[mahabharata|Mahābhārata]].[^1] …

> कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।
> karmaṇy evādhikāras te mā phaleṣu kadācana
> "<translation>" (tr. K. T. Telang, 1882)
> — Bhagavad Gītā 2.47ab[^2]

[^1]: <source>, <locator>.
[^2]: <e-text you opened>, 2.47.
```

---

## 6. Editorial policy

This section becomes `docs/CONTENT_GUIDE.md`, and its rules are condensed into `CLAUDE.md`. It binds humans and agents alike.

### 6.1 Non-negotiables

1. **Describe, attribute, don't adjudicate.** Present each tradition in its own terms and from its own sources first. Present critiques with attribution ("Rāmānuja's seven objections to Advaita, the *saptavidha-anupapatti*…"), never in the encyclopedia's voice.
2. **Two views, clearly labelled.** Traditional and academic accounts sometimes differ, on dates, authorship or events. When they do, give both under separate labels, each with a source. Neither is declared the truth, and neither is mocked.
3. **Report sacred narrative; don't judge it.** Write "According to the Śaṅkaradigvijaya…" or "The Bhāgavata Purāṇa narrates…". Don't call sacred narratives "myths", and don't present miraculous events as historical fact.
4. **No fabrication, ever.**
   - Never write a verse, mantra or quotation from memory. Quote only what you copied from a source retrieved in the same session, citing edition and locator. Otherwise paraphrase and give the locator.
   - Never invent a citation, page number, edition, ISBN or URL. Cite only sources you actually opened.
   - When unsure, say so in the text ("proposed dates range from…") and list the claim under *Needs human check* in the PR. A gap is better than an error.
5. **Fairness between traditions.** No tradition is presented as the "real" or "highest" form of Sanātana Dharma. Debates between schools are presented from both sides. Litmus test: a learned practitioner of the tradition *and* a careful scholar should both find the entry fair.
6. **Contested modern topics.** This covers varṇa and jāti, gender, the dating of the Vedas and the origins of Vedic culture, authorship disputes and reform movements. Give the main positions with high-quality sources, without polemic and without present-day party politics.
7. **Respectful, plain voice.** Use honorific names as titles where customary (Ādi Śaṅkarācārya, Śrī Rāmānuja) and a consistent short form in running text (Śaṅkara, Rāmānuja). Use no devotional superlatives in our own voice, and no dismissive language either.
8. **No promotion.** No donation links, endorsements or organisational marketing copy.
9. **Don't encode contested theology as data.** For example, there is no `avatarOf` field. Vaiṣṇava schools understand Kṛṣṇa's relation to Viṣṇu differently (for Gauḍīya Vaiṣṇavas, Kṛṣṇa is *svayaṃ bhagavān*). Relations like this belong in prose, with attribution.

### 6.2 Style

- Indian/British English spelling (centre, colour, programme).
- Lead sentence: **English name** (*IAST*; native script). Example: **Bhagavad Gita** (*Bhagavadgītā*; भगवद्गीता).
- Sanskrit and other Indic terms go in italic IAST (ISO 15919 for non-Sanskrit), with a short gloss on first use: *mokṣa* (liberation). Words naturalised in English (karma, dharma, yoga, guru, mantra, avatar) stay roman.
- Dates: "c." for approximate, BCE/CE, "8th century CE".
- Link the first mention of anything that has, or deserves, an entry: `[[adi-shankaracharya|Śaṅkara]]`.
- Footnote every date, attribution, number and quotation (`[^1]`). The frontmatter `references` list is the bibliography.
- Quoted verse is a blockquote in this order: the native-script line(s), the IAST line(s), the translation with its translator, then a citation line `— Text chapter.verse` with a footnote to the edition used.
- Length: texts, people and traditions 800–2,000 words; concepts 500–1,500; places and deities 300–1,000; stubs 1–3 sentences.

### 6.3 Article templates (H2 sections, in order)

| Collection | Sections |
|---|---|
| texts | Overview · Structure and contents · Key teachings · Authorship and dating · Commentaries and interpretations · Influence · Editions and translations |
| people | Overview · Life (with H3s *Traditional account* / *Historical perspective* where they differ) · Teachings · Works · Lineage · Legacy and institutions |
| traditions | Overview · History · Core doctrines · Scriptural basis · Practice · Lineage (paramparā) · Institutions and centres · Relations with other traditions |
| concepts | Definition · Etymology · In the scriptures · Interpretations across traditions · Related concepts |
| places | Overview · Significance · History · Associated traditions and figures |
| deities | Overview · In the scriptures · Iconography · Worship and festivals · In different traditions |

The infobox, relation lists, references and "Read online" links are rendered from data, so never write them into the body. A *Works* section discusses the works; the list itself is generated. The validator requires the first three sections of each template in published entries. Omit later sections only when there is genuinely nothing to say.

### 6.4 Sources (becomes `docs/SOURCES.md`)

| Tier | Use for | Examples |
|---|---|---|
| Primary texts | Original-language text, verse locators | GRETIL, SARIT, Muktabodha, Sanskrit Wikisource, sanskritdocuments.org, Digital Corpus of Sanskrit, archive.org scans of public-domain editions |
| Scholarship | History, dating, analysis | University-press books, peer-reviewed articles, Stanford Encyclopedia of Philosophy, Internet Encyclopedia of Philosophy, Brill's Encyclopedia of Hinduism |
| Reference | Orientation, basic facts | Encyclopaedia Britannica, Oxford Reference |
| Traditional | A tradition's own account, always attributed as such (`kind: traditional`) | Publications and official sites of maṭhas, pīṭhas and sampradāyas |
| Never the sole source | Not applicable | Wikipedia (use it only to find sources), blogs, forums, videos, quote sites, AI-generated sites |

### 6.5 Copyright and images

- Ancient original-language texts are public domain. When reproducing them, record the digital edition and its licence.
- Reproduce only public-domain translations, naming translator and year. Examples: Griffith's Ṛgveda, Telang's Gītā (*Sacred Books of the East* 8), Ganguli's Mahābhārata, Müller's Upaniṣads (*SBE* 1 and 15). Modern translations and commentaries are summarised and linked, never copied.
- Images: only public-domain or CC-licensed images from Wikimedia Commons, with credit and licence in frontmatter. No AI-generated images of deities, saints or historical persons.
- Our prose is original (CC BY-SA 4.0). Write it fresh, and never closely paraphrase a single source.

### 6.6 Verification levels (badge on every page)

| Level | Meaning | Set by |
|---|---|---|
| `ai-draft` | Written by an AI agent from cited sources; a human approved the PR without checking every claim | Content Writer routine |
| `human-reviewed` | A human checked the claims against the cited sources | You, in the PR or the CMS |
| `expert-verified` | Checked by a named scholar or traditional authority (`reviewedBy`) | You, after expert review |

Agents never set `human-reviewed` or `expert-verified`, and never lower a level a human set.

### 6.7 Reviewing a content PR (for the human who merges)

1. Open the preview URL and read each entry as a reader would.
2. Spot-check at least two claims per entry against the cited sources, always including every original-language quotation.
3. Check that traditional and academic positions are labelled, not blended.
4. Apply the fairness litmus test (§6.1, rule 5).
5. If you verified the claims, set `verification: human-reviewed` before merging. Otherwise merge as `ai-draft` or request changes.

---

## 7. Design direction

- **Feel:** a scholarly reference with the warmth of a manuscript: calm, typographic, generous whitespace. It should have the rigour of the Stanford Encyclopedia of Philosophy and a much better reading experience.
- **Avoid:** clip-art Om symbols, stock "spiritual" gradients, glowing auras, AI-generated imagery, saffron everywhere.
- **Colour:** warm paper background, deep ink text, one restrained accent (kumkum or saffron) for links and highlights, a matching dark mode, and WCAG AA contrast throughout.
- **Type:** serif body with full IAST coverage. Set Devanagari slightly larger than Latin so the two read at the same size. Keep a ~65–72 character measure and tabular numerals in infoboxes.
- **Core components:** `Infobox`, `DualDate`, `VerificationBadge`, `ScriptText` (lang-tagged), `EntryCard`, `RelationList`, `LineageChain`, `Breadcrumbs`, `TableOfContents`, `StubNotice`, `SearchBox`.
- **Budgets:** no JavaScript on entry pages beyond lazily loaded islands; LCP under 2 s on mid-range mobile; Lighthouse ≥ 95 in all four categories.

---

## 8. Quality gates

`npm run validate` (`scripts/validate-content.ts`) runs before every build and **fails** on:

1. Unresolved wikilinks or references; duplicate slugs across collections; malformed slugs.
2. Published entries with any of these problems:
   - fewer than 3 references, or (for texts) no primary reference
   - missing the first three template sections (§6.3)
   - a summary over 280 characters
   - no `roman`/`native` when `nativeScript` isn't `latn`
3. Cycles in `partOf`, `gurus` or `parent`.
4. A `from` later than its `to`; `expert-verified` without `reviewedBy`.
5. **Verse guard.** More than three consecutive Indic-script words fail, as does an italic run of six or more words with IAST diacritics, unless it sits in a blockquote ending in a footnoted citation line.

It **warns**, without failing, on stubs with 3+ inbound links, entries not updated for a year, and summaries that merely repeat the title.

Also: `npm test` (Vitest, covering graph computation and the validator), `astro check`, and `npm run build` (Pagefind runs after Astro). `check:cms` arrives in Phase 2, and `check:links` (cached, non-blocking, e.g. lychee) in Phase 3. CI runs every blocking check on every PR. `main` is protected and needs green CI.

---

## 9. Roadmap

### Phase 1: Website MVP

**Goal:** a deployed, searchable encyclopedia with the full data model, all templates and ~14 seed entries.

Milestones. Commit after each one, and `npm run build` must pass before you do:

1. **Scaffold.** Set up Astro + TypeScript strict + Tailwind + Fontsource fonts + ESLint/Prettier. Add `src/config/site.ts` (name, URL, `launched: false`) and `src/i18n/en.ts`.
2. **Content layer.** Create all six collections with the schemas from §5. Add the wikilink remark plugin and `src/lib/graph.ts`, which computes every view in §5.3.
3. **Tooling.** Write `scripts/validate-content.ts` (§8) and `scripts/new-entry.ts`, with Vitest tests for both graph and validator. npm scripts: `dev`, `build`, `validate`, `new`, `test`, `check`.
4. **Templates.**
   - Base layout: header with search, footer.
   - Entry layout following §4, with an infobox for each collection.
   - Collection index pages and the home page.
   - Static pages: About, How this is written (an honest account of AI drafting and human review), Editorial policy, Transliteration, Sources, Contribute.
   - A 404 page.
5. **Seed content.**
   - Full entries: Ṛgveda, Bhagavad Gītā, Brahma Sūtra, Śaṅkara's Brahma Sūtra Bhāṣya, Yoga Sūtra; Vyāsa, Ādi Śaṅkarācārya, Patañjali; Vedānta, Advaita Vedānta, Yoga (darśana); brahman, dharma; Śṛṅgeri Śāradā Pīṭham.
   - Stubs for everything these entries link to.
   - Every entry obeys §6, especially rule 4.
6. **Search and SEO.**
   - Pagefind, with ASCII-folded aliases and native-script variants indexed.
   - Sitemap, canonical URLs, Open Graph tags.
   - JSON-LD: `Book`/`CreativeWork`, `Person`, `Place`, `BreadcrumbList`.
   - `robots.txt`. While `launched` is false, every page is `noindex` and robots disallows crawling.
7. **Repo docs.**
   - `CLAUDE.md` (≤ 150 lines): purpose, commands, repo map, the rules of §6.1 and §6.5, PR conventions, and "read `docs/CONTENT_GUIDE.md` before writing content".
   - `docs/CONTENT_GUIDE.md`, `docs/SOURCES.md` and `docs/DECISIONS.md`.
   - `backlog/content.yaml` with all of Tier 1, in the format given in §11.
   - `backlog/features.md` with the Phase 4–6 items.
   - The PR template and the correction issue template.
8. **Ship.**
   - `git init`, then create the GitHub repo with `gh`.
   - CI workflow and branch protection on `main`.
   - Vercel deployment with a preview URL for every PR.

**Acceptance criteria**

- [ ] `npm run validate`, `npm test`, `astro check` and `npm run build` pass with zero errors.
- [ ] Bhagavad Gītā page:
  - shows that it is part of the Mahābhārata
  - credits Vyāsa as author, labelled *traditional*
  - gives traditional and academic dating, each with its source
  - lists Vedānta under "Authoritative in"
- [ ] Ādi Śaṅkarācārya page:
  - shows the guru chain (Gauḍapāda → Govinda Bhagavatpāda → Śaṅkara)
  - lists the Brahma Sūtra Bhāṣya under Works, computed rather than hand-written
  - links Advaita Vedānta and Śṛṅgeri
- [ ] The Brahma Sūtra page lists Śaṅkara's bhāṣya under Commentaries (computed).
- [ ] Searching `shankara`, `śaṅkara`, `शङ्कर` and `शंकर` each returns Ādi Śaṅkarācārya.
- [ ] Every page shows its verification badge, and stubs show a stub notice.
- [ ] Lighthouse mobile scores are ≥ 95 in all four categories on the home page and on one entry page.
- [ ] The site is usable at 360 px wide, has a dark mode and is keyboard-navigable.
- [ ] The live URL works; opening a PR runs CI and produces a preview URL.

### Phase 2: CMS and editorial workflow

**Goal:** you, and later invited editors, can create and edit entries in the browser. Every edit goes through the same PR and CI gate.

1. Keystatic at `/keystatic`, with one collection per content collection. Fields mirror §5, using relationship fields for references and a Markdown body. It runs in local mode in dev and GitHub mode in production.
2. `npm run check:cms` fails when Keystatic fields and Zod schemas diverge. It runs in CI.
3. *Edit this page* deep-links to the entry in Keystatic. *Report an error* opens a prefilled GitHub issue with the entry's URL and title.
4. CMS edits go to a branch and open a PR. They never commit straight to `main`.
5. A `/editorial/` dashboard (noindex) listing:
   - AI drafts awaiting human review, oldest first
   - the most-linked stubs
   - entries missing template sections
   - counts by status and verification level
6. Cookie-less analytics (Vercel Web Analytics).
7. **Supabase:** a project with these pieces.
   - **`corrections` table.** Anyone can insert through row-level security; only maintainers can read. *Report an error* gets a form, so readers without GitHub accounts can report. A maintainer action turns a correction into a GitHub issue.
   - **`reviewer_applications` table.** Supabase Auth accounts for approved reviewers, who can mark entries `human-reviewed` or `expert-verified` through the CMS.
   - **Schema in `supabase/migrations/`,** applied in CI, with generated TypeScript types.
8. **Cloudflare:**
   - an R2 bucket for media (images, manuscript scans, audio), referenced from entries' `image.src`
   - Turnstile on the corrections and reviewer forms
   - DNS for the custom domain
9. **Configuration:** secrets live in Vercel environment variables and GitHub Actions secrets, never in the repo. `.env.example` lists them.

**Acceptance criteria**

- [ ] From the deployed site you can log in and edit an entry. The change arrives as a PR with green CI, and merging deploys it.
- [ ] A reader without a GitHub account can submit a correction (Turnstile-protected); it lands in Supabase and cannot be read back by the public.
- [ ] An image uploaded to R2 renders on an entry page.
- [ ] A person created in the CMS with a guru appears under that guru's Disciples after deploy.
- [ ] `check:cms` fails when a field exists on only one side.

### Phase 3: Scheduled content engine

**Goal:** the encyclopedia grows on a schedule, and every change arrives as a reviewable PR.

1. Expand `backlog/content.yaml` to Tier 1 + Tier 2 (~400 items), deduplicated against existing entries.
2. Harden the gates:
   - verse guard
   - template-section check
   - `check:links` (cached, non-blocking)
   - reachability check on reference URLs added in a PR
3. GitHub labels: `content`, `audit`, `feature`, `needs-review`. Extend the PR template with the sections the routines fill in.
4. `docs/ROUTINES.md`, holding the live copies of the routine prompts from §11.
5. Dry run: run the Content Writer prompt once interactively and fix whatever trips it up. Then create the routines with `/schedule`.

**Acceptance criteria**

- [ ] The interactive dry run produces a PR that passes CI and needs no structural fixes.
- [ ] The routines exist with the cadence in §11, and the first scheduled PR arrives and passes CI.

### Phase 4: Discovery

- **Lineage graphs.** One page per tradition (`/lineages/<tradition>/`) and a compact chain on person pages. Dīkṣā and lineage edges are solid, śikṣā edges dashed. Include an accessible list fallback, and lazy-load the island.
- **Timeline** (`/timeline/`). Ranges are drawn as bars, with a toggle between traditional and academic dates and filters by collection and tradition.
- **Canon hubs.**
  - The Vedic corpus as a tree: Veda → Śākhā → Saṃhitā / Brāhmaṇa / Āraṇyaka / Upaniṣad.
  - Purāṇas, Darśanas and Āgamas.
  - Bhakti literatures by language.
- **Script toggle.** Devanagari ↔ IAST ↔ Tamil, Telugu, Kannada, Malayalam, Bengali and Gujarati scripts via Sanscript, remembered per reader.
- **More to explore.**
  - Places map (`/map/`) with MapLibre and OpenStreetMap.
  - Richer deity entries: iconography, worship, festivals.
  - A glossary with hover cards.
  - Faceted filters on index pages.

### Phase 5: Primary-text reader

- `verses` data files, e.g. `src/content/verses/bhagavad-gita/02.yaml`. Each file records its source (edition, URL, licence, retrieval date, checksum of the imported text).
- Each verse holds:
  - `native`: canonical text, imported and never typed by hand
  - `roman`: generated with Sanscript, overridable only with a note
  - `padaccheda` (word split) and word meanings
  - translations: public-domain, or original ones that are clearly labelled
  - notes
- Reader at `/texts/<slug>/<chapter>/` with verse permalinks, the script toggle, and side-by-side commentary across traditions. Commentaries shown must be public-domain or our own labelled summaries.
- Import scripts (`scripts/import/<source>.ts`) for open e-texts, recording the licence of each.
- First texts: Bhagavad Gītā, the Īśa, Kaṭha and Māṇḍūkya Upaniṣads, and the Yoga Sūtra.
- **Acceptance:** every verse traces to a source edition and locator, and no original-language text was typed by an AI.

### Phase 6: Reach and community

- Hindi edition at `/hi/`: the UI first, then translated entries. Revisit the CMS for multi-locale editing.
- Public data: a static JSON API (`/api/v1/<collection>.json`) and downloadable dumps under the content licence.
- An Open Graph image for every entry, RSS/Atom feeds of new and updated entries, and a "Verse of the day" built on Phase 5 data.
- A contributor guide, a reviewer programme (`expert-verified` with credited reviewers) and a corrections workflow.
- Living persons and present-day institutions, under a strict sourcing policy.
- PWA and offline reading.

---

## 10. Kickoff prompts

**Phase 1** (paste into Claude Code, opened in this folder):

```
Read MASTER_PROMPT.md completely before doing anything. Build Phase 1 (Website MVP) exactly as
specified in §9, using the stack in §3, the content model in §5 and the editorial rules in §6.

- Work milestone by milestone (1 → 8). After each, run `npm run build` (and `npm run validate`
  once it exists), fix every error, and commit with a conventional commit message.
- Use the latest stable versions and check current documentation for Astro, Pagefind and
  Vercel, Supabase and Cloudflare instead of relying on memory.
- If a frontend-design skill is available, use it for the visual system, following §7.
- Where this spec is silent, choose the simplest option that keeps later phases possible and
  record it in docs/DECISIONS.md.
- Seed content must obey §6, above all rule 4 (no fabrication). If you can't retrieve a source
  for a claim, leave the claim out.
- Before creating the GitHub repository and before the first deployment, show me the repo name,
  visibility and deploy target, and wait for my OK.
- Don't start Phase 2. Finish with the Phase 1 acceptance checklist, marking each item
  pass/fail with evidence.
```

**Phases 2–6:**

```
Read MASTER_PROMPT.md, CLAUDE.md and docs/DECISIONS.md. Build Phase <N> as specified in §9 of
MASTER_PROMPT.md. Work on a branch `phase-<N>`. Same working rules as Phase 1: commit per
milestone, keep validate/test/check/build green, log decisions in docs/DECISIONS.md, check
current docs instead of relying on memory. Open a PR when done and finish with the phase's
acceptance checklist, marking each item pass/fail with evidence.
```

---

## 11. Scheduled routines

Create these with `/schedule` once Phase 3 is done. They run in the cloud against the GitHub repo, so they keep working when your computer is off. They also start every run with no memory of earlier runs: the repository (`CLAUDE.md`, `docs/`, `backlog/`) is their memory.

| Routine | Cadence (IST) | Batch | Skips its run when |
|---|---|---|---|
| Content Writer | Mon, Wed, Fri 06:00 | 3 entries | 3 or more `content` PRs are open |
| Quality Auditor | Sun 06:00 | up to 30 entries reviewed | an `audit` PR is open |
| Feature Builder *(optional)* | Thu 06:00 | 1 small feature | a `feature` PR is open |

Your review time is the real bottleneck. Three entries, three times a week, comes to ~450 entries a year. Raise the cadence only when you're consistently merging within a few days. Build big features (Phases 4–6) interactively with the kickoff prompts; the Feature Builder is for small, well-specified items.

**Backlog format**

```yaml
# backlog/content.yaml (file order = priority order)
- slug: katha-upanishad
  collection: texts
  title: Kaṭha Upaniṣad
  tier: 1
  status: todo          # todo | done | blocked
  notes: Principal Upaniṣad of the Kṛṣṇa Yajurveda; dialogue of Naciketas and Yama
```

`backlog/features.md` is an ordered checklist. Each item has a one-line goal and its acceptance criteria.

### Routine A: Content Writer

```
You are the scheduled Content Writer for the Sanatan Dharma Wiki repository. You have no memory
of previous runs; the repository is your memory.

1. Read CLAUDE.md, docs/CONTENT_GUIDE.md and docs/SOURCES.md in full. If they conflict with this
   prompt, they win.
2. Throttle: list open PRs labelled `content`. If there are 3 or more, stop without changing
   anything.
3. Pick work: take the first 3 items in backlog/content.yaml with status `todo` whose slug is
   not already part of an open PR.
4. For each item:
   a. Research it using the sources allowed in docs/SOURCES.md. Open every source you cite.
      Cite at least 3, including at least 1 primary source for texts.
   b. If a stub exists, expand it in place. Otherwise create the entry with
      `npm run new -- <collection> <slug>`.
   c. Follow the article template for its collection. Where traditional and academic views
      differ, give both under separate labels. Describe, attribute, don't adjudicate.
   d. Quote original-language text only when you copied it from a source retrieved in this
      run, with edition and locator. Never write a verse, mantra or quotation from memory.
   e. Link first mentions with [[slug]]. For every link target that doesn't exist yet, create
      a stub and append a `todo` item for it to the backlog.
   f. Set status: published, verification: ai-draft, and today's date for created/updated.
5. In backlog/content.yaml mark finished items `done`, or `blocked` with a one-line reason.
6. Run `npm run validate && npm test && npm run build` and fix every error. Don't touch
   schemas, components or config. If the schema can't express something, note it under
   "Schema requests" in the PR.
7. Create branch `content/<YYYY-MM-DD>-<first-slug>`, commit as `content: add <titles>`, push,
   and open a PR labelled `content` containing:
   - a table: entry · collection · words · references · new stubs
   - "Needs human check": every claim you are not fully sure of (dates, attributions,
     numbers, quotations) with the source you relied on
   - "Schema requests", if any

Never push to main, never merge, and never rewrite entries marked human-reviewed or
expert-verified.
```

### Routine B: Quality Auditor

```
You are the scheduled Quality Auditor for the Sanatan Dharma Wiki repository. You have no memory
of previous runs; the repository is your memory.

1. Read CLAUDE.md and docs/CONTENT_GUIDE.md in full.
2. Throttle: if a PR labelled `audit` is open, stop.
3. Run `npm run validate`, `npm run build` and `npm run check:links`, and collect every error
   and warning.
4. Review up to 30 entries with verification: ai-draft, oldest `updated` first, checking for:
   - citations that don't support their claim, dead links, locators that look invented
   - missing template sections; tone problems (devotional or dismissive voice, one tradition
     judged by another's standards)
   - contradictions between related entries (a disciple dated before their guru, a commentary
     dated before its root text, one name spelled several ways)
   - original-language quotations without a retrievable source
5. Fix small, certain problems directly: typos, broken links with an obvious replacement,
   missing wikilinks, formatting. For anything needing judgement, open a GitHub issue labelled
   `needs-review` with the entry, the problem and the evidence. Never edit human-reviewed or
   expert-verified entries beyond broken links and typos; open an issue instead.
6. Groom backlog/content.yaml: move stubs with 3+ inbound links up, add important missing
   subjects you noticed, remove duplicates. File order is priority order.
7. Run validate and build again, then open a PR `audit/<YYYY-MM-DD>` labelled `audit` with a
   report: what you checked, what you fixed, which issues you opened, and what changed in the
   backlog.

Never push to main or merge.
```

### Routine C: Feature Builder (optional)

```
You are the scheduled Feature Builder for the Sanatan Dharma Wiki repository. You have no memory
of previous runs; the repository is your memory.

1. Read CLAUDE.md, MASTER_PROMPT.md §3–§8 and docs/DECISIONS.md.
2. Throttle: if a PR labelled `feature` is open, stop.
3. Take the first unchecked item in backlog/features.md. If it is bigger than about a day's
   work, split it into smaller items in that file and do only the first.
4. Implement it with the smallest change that does the job: static by default, islands only
   where interaction needs them, accessible, within the §7 budgets.
5. Schema changes must be additive. Otherwise include a migration in scripts/migrations/,
   applied to all content in the same PR. Either way, update the CMS config to match, and
   `npm run check:cms` must pass.
6. Run `npm run validate && npm test && npx astro check && npm run build`. Add or update tests
   wherever logic changed.
7. Record decisions in docs/DECISIONS.md, tick the item in backlog/features.md, and open a PR
   `feat/<name>` labelled `feature` that explains what changed and how to verify it on the
   preview URL.

Never push to main or merge.
```
