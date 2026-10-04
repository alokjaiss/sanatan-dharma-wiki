/**
 * npm run new -- <collection> <slug> [--stub] [--title "Title"]
 *
 * Creates src/content/<collection>/<slug>.md with every field of the collection and the
 * article template's sections. New entries start as `draft` (hidden in production) unless
 * --stub is given. Placeholders in <angle brackets> must be replaced before publishing;
 * `npm run validate` refuses them in non-draft entries.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readEntries } from '../src/lib/content-index';
import {
  COLLECTIONS,
  SLUG_PATTERN,
  TEMPLATES,
  isCollectionName,
  type CollectionName,
} from '../src/lib/schema-meta';

const USAGE = 'Usage: npm run new -- <collection> <slug> [--stub] [--title "Title"]';

const args = process.argv.slice(2);
const titleFlag = args.indexOf('--title');
const title = titleFlag >= 0 ? args[titleFlag + 1] : undefined;
const stub = args.includes('--stub');
const [collection, slug] = args.filter(
  (arg, position) => !arg.startsWith('--') && (titleFlag < 0 || position !== titleFlag + 1),
);

function fail(message: string): never {
  console.error(`${message}\n${USAGE}`);
  process.exit(1);
}

if (!collection || !slug) fail('Missing collection or slug.');
if (!isCollectionName(collection)) fail(`"${collection}" isn't a collection. Use one of: ${COLLECTIONS.join(', ')}.`);
if (!SLUG_PATTERN.test(slug)) fail(`"${slug}" isn't a valid slug (lowercase ASCII words joined by hyphens).`);
const taken = readEntries().entries.find((entry) => entry.slug === slug);
if (taken) fail(`"${slug}" already exists: ${taken.file}`);

const today = new Date().toISOString().slice(0, 10);

const FIELDS: Record<CollectionName, string> = {
  texts: `genre: other # samhita | brahmana | aranyaka | upanishad | vedanga | sutra | karika | itihasa | purana | upapurana | dharmashastra | agama | tantra | bhashya | tika | prakarana | stotra | kavya | bhakti-poetry | other
canon: other # shruti | smriti | other (conventional, for navigation)
# canonNote: Where traditions classify it differently.
languages: [sanskrit]
# veda: rigveda # rigveda | samaveda | shukla-yajurveda | krishna-yajurveda | atharvaveda
# shakha: Recension
# partOf: parent-text-slug
# order: 1
# commentsOn: root-text-slug
authorship: [] # - { person: person-slug, role: author, basis: traditional }
# authorshipNote: e.g. the apauruṣeya view
deities: []
concepts: []
# dating:
#   traditional:
#     - { label: "As the cited source states it", source: "Who holds this view" }
#   academic:
#     - { label: "c. 2nd century BCE", from: -200, to: -101, source: "Author year" }
# structure: 18 adhyāyas, 700 verses
readOnline: [] # - { label: "Sanskrit e-text", url: "https://…", kind: original, language: sanskrit, license: open-license }`,
  people: `roles: [acharya] # rishi | acharya | philosopher | commentator | saint | poet | guru | grammarian | scholar | reformer | patron | itihasa-purana-figure | other
traditions: []
gurus: [] # - { person: guru-slug, kind: diksha } # diksha | shiksha | lineage
# dating:
#   traditional:
#     - { label: "As the cited source states it", source: "Who holds this view" }
#   academic:
#     - { label: "c. 8th century CE", from: 700, to: 799, source: "Author year" }
# birthplace: place-slug
# region: Kerala
languages: []
living: false
concepts: []`,
  traditions: `kind: school # darshana | school | sampradaya | sub-tradition | monastic-order | movement
# parent: parent-tradition-slug
founders: []
coreTexts: []
deityFocus: []
concepts: []
# dating:
#   academic:
#     - { label: "c. 8th century CE", from: 700, to: 799, source: "Author year" }`,
  concepts: `# domain: metaphysics # metaphysics | epistemology | ethics | soteriology | cosmology | ritual | practice | social | aesthetics | other
related: []
interpretations: [] # - { tradition: tradition-slug, summary: "One neutral paragraph." }`,
  places: `kind: other # matha | peetha | tirtha | temple | kshetra | ashram | city | region | river | mountain | other
tags: [] # jyotirlinga | shakti-peetha | divya-desam | char-dham | amnaya-matha
location:
  region: <State or region>
  country: India
  # lat: 0
  # lng: 0
traditions: []
people: []
concepts: []`,
  deities: `related: []
concepts: []`,
};

const frontmatter = `---
title: ${title ?? '<Common English title>'}
roman: <IAST or ISO 15919>
native: <Native script>
nativeScript: deva
aliases: []
summary: <One sentence, at most 280 characters.>
status: ${stub ? 'stub' : 'draft'}
verification: ai-draft
${FIELDS[collection]}
references: [] # - { kind: primary, title: "…", url: "https://…", locator: "…" }
created: ${today}
updated: ${today}
---
`;

const body = stub
  ? '\n<One to three sentences, with a footnote for every claim.>\n'
  : `\n${TEMPLATES[collection].map((section) => `## ${section}\n\n<!-- Write this section. Footnote every claim. -->\n`).join('\n')}`;

const directory = `src/content/${collection}`;
const file = `${directory}/${slug}.md`;
if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
writeFileSync(file, frontmatter + body, 'utf8');
console.log(`Created ${file} (${stub ? 'stub' : 'draft'}). Read docs/CONTENT_GUIDE.md before writing.`);
