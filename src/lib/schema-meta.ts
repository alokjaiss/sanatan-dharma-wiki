/**
 * Facts about the content model that both the site and the tooling need, kept free of any
 * Astro imports so scripts and tests can use them. See MASTER_PROMPT.md §5.
 */

export const COLLECTIONS = ['texts', 'people', 'traditions', 'concepts', 'places', 'deities'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

export function isCollectionName(value: string): value is CollectionName {
  return (COLLECTIONS as readonly string[]).includes(value);
}

/** ASCII kebab-case; unique across all collections. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** ISO 15924 script codes (lowercase) used for the `native` field. */
export const SCRIPTS = ['deva', 'taml', 'telu', 'knda', 'mlym', 'beng', 'gujr', 'guru', 'orya', 'latn'] as const;
export type ScriptCode = (typeof SCRIPTS)[number];

/** BCP 47 language-script tags for `lang` attributes on native-script text. */
export const SCRIPT_LANG: Record<ScriptCode, string> = {
  deva: 'sa-Deva',
  taml: 'ta',
  telu: 'te',
  knda: 'kn',
  mlym: 'ml',
  beng: 'bn',
  gujr: 'gu',
  guru: 'pa',
  orya: 'or',
  latn: 'en',
};

export const STATUSES = ['stub', 'draft', 'published'] as const;
export const VERIFICATION_LEVELS = ['ai-draft', 'human-reviewed', 'expert-verified'] as const;
export const REFERENCE_KINDS = ['primary', 'secondary', 'tertiary', 'traditional'] as const;

export const TEXT_GENRES = [
  'samhita',
  'brahmana',
  'aranyaka',
  'upanishad',
  'vedanga',
  'sutra',
  'karika',
  'itihasa',
  'purana',
  'upapurana',
  'dharmashastra',
  'agama',
  'tantra',
  'bhashya',
  'tika',
  'prakarana',
  'stotra',
  'kavya',
  'bhakti-poetry',
  'other',
] as const;
export const CANONS = ['shruti', 'smriti', 'other'] as const;
export const VEDAS = [
  'rigveda',
  'samaveda',
  'shukla-yajurveda',
  'krishna-yajurveda',
  'atharvaveda',
] as const;
export const AUTHORSHIP_ROLES = [
  'author',
  'seer',
  'compiler',
  'redactor',
  'commentator',
  'translator',
] as const;
export const AUTHORSHIP_BASES = ['traditional', 'scholarly', 'disputed'] as const;
export const READ_ONLINE_KINDS = ['original', 'translation', 'commentary'] as const;
export const READ_ONLINE_LICENSES = ['public-domain', 'open-license', 'link-only'] as const;

export const PERSON_ROLES = [
  'rishi',
  'acharya',
  'philosopher',
  'commentator',
  'saint',
  'poet',
  'guru',
  'grammarian',
  'scholar',
  'reformer',
  'patron',
  'itihasa-purana-figure',
  'other',
] as const;
export const GURU_KINDS = ['diksha', 'shiksha', 'lineage'] as const;

export const TRADITION_KINDS = [
  'darshana',
  'school',
  'sampradaya',
  'sub-tradition',
  'monastic-order',
  'movement',
] as const;

export const CONCEPT_DOMAINS = [
  'metaphysics',
  'epistemology',
  'ethics',
  'soteriology',
  'cosmology',
  'ritual',
  'practice',
  'social',
  'aesthetics',
  'other',
] as const;

export const PLACE_KINDS = [
  'matha',
  'peetha',
  'tirtha',
  'temple',
  'kshetra',
  'ashram',
  'city',
  'region',
  'river',
  'mountain',
  'other',
] as const;

/**
 * Where each relation is stored (MASTER_PROMPT.md §5.3). Relations are stored once; every
 * reverse view is computed in `graph.ts`. `key` is set when the field is an array of objects.
 */
export interface RelationSpec {
  field: string;
  key?: string;
  target: CollectionName;
  many: boolean;
}

export const RELATIONS: Record<CollectionName, readonly RelationSpec[]> = {
  texts: [
    { field: 'partOf', target: 'texts', many: false },
    { field: 'commentsOn', target: 'texts', many: false },
    { field: 'authorship', key: 'person', target: 'people', many: true },
    { field: 'deities', target: 'deities', many: true },
    { field: 'concepts', target: 'concepts', many: true },
  ],
  people: [
    { field: 'traditions', target: 'traditions', many: true },
    { field: 'gurus', key: 'person', target: 'people', many: true },
    { field: 'birthplace', target: 'places', many: false },
    { field: 'concepts', target: 'concepts', many: true },
  ],
  traditions: [
    { field: 'parent', target: 'traditions', many: false },
    { field: 'founders', target: 'people', many: true },
    { field: 'coreTexts', target: 'texts', many: true },
    { field: 'deityFocus', target: 'deities', many: true },
    { field: 'concepts', target: 'concepts', many: true },
  ],
  concepts: [
    { field: 'related', target: 'concepts', many: true },
    { field: 'interpretations', key: 'tradition', target: 'traditions', many: true },
  ],
  places: [
    { field: 'traditions', target: 'traditions', many: true },
    { field: 'people', target: 'people', many: true },
    { field: 'concepts', target: 'concepts', many: true },
  ],
  deities: [
    { field: 'related', target: 'deities', many: true },
    { field: 'concepts', target: 'concepts', many: true },
  ],
};

/** H2 sections of each article template, in order (MASTER_PROMPT.md §6.3). */
export const TEMPLATES: Record<CollectionName, readonly string[]> = {
  texts: [
    'Overview',
    'Structure and contents',
    'Key teachings',
    'Authorship and dating',
    'Commentaries and interpretations',
    'Influence',
    'Editions and translations',
  ],
  people: ['Overview', 'Life', 'Teachings', 'Works', 'Lineage', 'Legacy and institutions'],
  traditions: [
    'Overview',
    'History',
    'Core doctrines',
    'Scriptural basis',
    'Practice',
    'Lineage (paramparā)',
    'Institutions and centres',
    'Relations with other traditions',
  ],
  concepts: [
    'Definition',
    'Etymology',
    'In the scriptures',
    'Interpretations across traditions',
    'Related concepts',
  ],
  places: ['Overview', 'Significance', 'History', 'Associated traditions and figures'],
  deities: [
    'Overview',
    'In the scriptures',
    'Iconography',
    'Worship and festivals',
    'In different traditions',
  ],
};

/** Published entries must contain at least this many leading template sections. */
export const REQUIRED_SECTION_COUNT = 3;
export const MIN_PUBLISHED_REFERENCES = 3;
export const SUMMARY_MAX_LENGTH = 280;
