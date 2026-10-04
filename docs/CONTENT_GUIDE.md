# Content guide and editorial policy

This guide binds everyone who writes for the encyclopedia: people, AI agents and the CMS alike. It is published on the site as the editorial policy. The project plan (`MASTER_PROMPT.md` §6) is its origin; when the two differ, this file wins.

## 1. Non-negotiables

1. **Describe, attribute, don't adjudicate.** Present each tradition in its own terms and from its own sources first. Present critiques with attribution ("Rāmānuja's objections to Advaita…"), never in the encyclopedia's own voice.
2. **Two views, clearly labelled.** Traditional and academic accounts sometimes differ, on dates, authorship or events. When they do, give both under separate labels, each with a source. Neither is declared the truth, and neither is mocked.
3. **Report sacred narrative; don't judge it.** Write "According to the Śaṅkaradigvijaya…" or "The Bhāgavata Purāṇa narrates…". Don't call sacred narratives "myths", and don't present miraculous events as historical fact.
4. **No fabrication, ever.**
   - Never write a verse, mantra or quotation from memory. Quote only what you copied from a source retrieved in the same session, citing edition and locator. Otherwise paraphrase and give the locator.
   - Never invent a citation, page number, edition, ISBN or URL. Cite only sources you actually opened.
   - When unsure, say so in the text ("proposed dates range from…") and list the claim under *Needs human check* in the pull request. A gap is better than an error.
5. **Fairness between traditions.** No tradition is presented as the "real" or "highest" form of Sanātana Dharma. Debates between schools are presented from both sides. The test: a learned practitioner of the tradition *and* a careful scholar should both find the entry fair.
6. **Contested modern topics.** This covers varṇa and jāti, gender, the dating of the Vedas and the origins of Vedic culture, authorship disputes and reform movements. Give the main positions with high-quality sources, without polemic and without present-day party politics.
7. **Respectful, plain voice.** Use honorific names as titles where customary (Ādi Śaṅkarācārya, Śrī Rāmānuja) and a consistent short form in running text (Śaṅkara, Rāmānuja). Use no devotional superlatives in our own voice, and no dismissive language either.
8. **No promotion.** No donation links, endorsements or organisational marketing copy.
9. **Don't encode contested theology as data.** For example, there is no `avatarOf` field: Vaiṣṇava schools understand Kṛṣṇa's relation to Viṣṇu differently. Relations like this belong in prose, with attribution.
10. **Living persons and present-day organisations** are out of scope until Phase 6.

## 2. Style

- Indian/British English spelling (centre, colour, programme).
- Lead sentence: **English name** (*IAST*; native script), for example **Bhagavad Gita** (*Bhagavadgītā*; भगवद्गीता).
- Sanskrit and other Indic terms go in italic IAST (ISO 15919 for other Indian languages), glossed on first use: *mokṣa* (liberation). Words naturalised in English stay roman: karma, dharma, yoga, guru, mantra, avatar.
- Dates: "c." for approximate, BCE/CE, "8th century CE".
- Link the first mention of anything that has, or deserves, an entry: `[[adi-shankaracharya|Śaṅkara]]`. Every link target must exist; create a stub if needed (§5).
- Footnote every date, attribution, number and quotation with a GFM footnote (`[^1]`). The frontmatter `references` list is the bibliography; footnotes point to specific places in it.
- Length: texts, people and traditions 800–2,000 words; concepts 500–1,500; places and deities 300–1,000; stubs 1–3 sentences.
- Text must be Unicode NFC (precomposed IAST). The validator rejects anything else.

### Quoting a verse

A quotation is a blockquote, in this order: native-script lines, IAST lines in italics, the translation with its translator, then a citation line starting with "—" that carries a footnote to the edition used. End lines with `\` to keep verse lines apart.

```markdown
> कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\
> मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥
>
> *karmaṇy evādhikāras te mā phaleṣu kadā cana*\
> *mā karmaphalahetur bhūr mā te saṅgo 'stv akarmaṇi*
>
> "Your business is with action alone; not by any means with fruit…" (tr. K. T. Telang, 1882)
>
> — Bhagavad Gītā 2.47[^3]
```

The validator's *verse guard* rejects more than three Indic-script words, or an italic IAST run of six or more words, anywhere outside such a cited blockquote. Names in native script, the entry's own `native` and `aliases` values, are always allowed.

## 3. Article templates

Use these H2 sections, in this order. The first three are required in published entries; omit later sections only when there is genuinely nothing to say.

| Collection | Sections |
|---|---|
| texts | Overview · Structure and contents · Key teachings · Authorship and dating · Commentaries and interpretations · Influence · Editions and translations |
| people | Overview · Life (with H3s *Traditional account* / *Historical perspective* where they differ) · Teachings · Works · Lineage · Legacy and institutions |
| traditions | Overview · History · Core doctrines · Scriptural basis · Practice · Lineage (paramparā) · Institutions and centres · Relations with other traditions |
| concepts | Definition · Etymology · In the scriptures · Interpretations across traditions · Related concepts |
| places | Overview · Significance · History · Associated traditions and figures |
| deities | Overview · In the scriptures · Iconography · Worship and festivals · In different traditions |

The infobox, relation lists, references and "Read the text online" links are generated from frontmatter, so don't repeat them in the body. A *Works* section discusses the works; the list itself is generated.

## 4. Frontmatter

`npm run new -- <collection> <slug>` creates a file with every field. The full schema is in `src/lib/schemas.ts`; the essentials:

- **Names.** `title` is the common English form. `roman` is IAST (or ISO 15919). `native` is the native script, and `nativeScript` its ISO 15924 code (`deva`, `taml`, …). `aliases` lists every other spelling a reader might search for, including plain ASCII and Hindi-style spellings.
- **`summary`**: one sentence, at most 280 characters. It is used on cards, in search results and as the page description.
- **`status`**: `stub`, `draft` (hidden in production) or `published`.
- **`verification`**: `ai-draft`, `human-reviewed` or `expert-verified` (§7).
- **`references`**: published entries need at least three; texts need at least one `primary`. Each has `kind` (`primary`, `secondary`, `tertiary`, `traditional`), `title`, and where known `author`, `year`, `publisher`, `url`, `locator`. Only cite URLs you opened, and never invent a locator.
- **`dating`**: `traditional` and `academic` lists of `{ label, from?, to?, source }`. `label` is what readers see; `from`/`to` are years for sorting (negative = BCE). `source` names who holds the view.
- **Relations** are stored once, on the entry in the table below. The reverse views (disciples, works, commentaries and so on) are computed. Never write them by hand.

| Stored on | Field | Shown on the other entry as |
|---|---|---|
| text | `partOf`, `commentsOn`, `authorship[].person`, `deities` | Contents · Commentaries · Works · Texts |
| person | `gurus[].person` (`diksha`, `shiksha` or `lineage`), `traditions`, `birthplace` | Disciples · Ācāryas and figures · Born here |
| tradition | `parent`, `founders`, `coreTexts`, `deityFocus` | Branches · Founded · Authoritative in · Traditions |
| place | `traditions`, `people` | Centres · Places |
| any | `concepts` | Discussed in |
| concept | `related`, `interpretations[].tradition` | Related concepts · Key doctrines |

Slugs are ASCII kebab-case and unique across all collections. Drop diacritics, write ś/ṣ as `sh`, ṛ as `ri` and c as `ch`: `rigveda`, `adi-shankaracharya`, `brahma-sutra-bhashya-shankara`. A published slug never changes.

## 5. Stubs

When you link to something that has no entry, create a stub: `npm run new -- <collection> <slug> --stub`. A stub has real names, a one-sentence `summary`, one to three sentences of body with footnotes, and at least one reference. Add it to `backlog/content.yaml` so it gets written in full.

## 6. Sources and copyright

Allowed sources are listed in [`docs/SOURCES.md`](https://github.com/alokjaiss/sanatan-dharma-wiki/blob/main/docs/SOURCES.md) (shown on the site as the Sources page).

- Ancient original-language texts are public domain. When reproducing them, record the digital edition and its terms.
- Reproduce only public-domain translations, naming translator and year. Examples: Griffith's Ṛgveda, Telang's Gītā (*Sacred Books of the East* 8), Thibaut's Vedānta-Sūtras (*SBE* 34, 38), Ganguli's Mahābhārata. Modern translations and commentaries are summarised and linked, never copied.
- Images: only public-domain or CC-licensed images from Wikimedia Commons, with credit and licence in frontmatter. No AI-generated images of deities, saints or historical persons.
- Our prose is original (CC BY-SA 4.0). Write it fresh, and never closely paraphrase a single source.

## 7. Verification levels

| Level | Meaning | Set by |
|---|---|---|
| `ai-draft` | Written by an AI agent from cited sources; a person approved the pull request without checking every claim | The writing agent |
| `human-reviewed` | A person checked the claims against the cited sources | The reviewer, in the pull request or the CMS |
| `expert-verified` | Checked by a named scholar or traditional authority (`reviewedBy`) | A maintainer, after expert review |

Agents never set `human-reviewed` or `expert-verified`, and never lower a level a person set.

## 8. Reviewing a content pull request

1. Open the preview deployment and read each entry as a reader would.
2. Spot-check at least two claims per entry against the cited sources, always including every original-language quotation.
3. Check that traditional and academic positions are labelled, not blended.
4. Apply the fairness test (§1, rule 5).
5. If you verified the claims, set `verification: human-reviewed` before merging. Otherwise merge as `ai-draft` or request changes.
