/**
 * Zod schemas for every collection (MASTER_PROMPT.md §5). Written once and used by both
 * `src/content.config.ts` (with Astro's `reference()`) and `scripts/validate-content.ts`
 * (with a plain slug check), so the site and the tooling can never disagree about the model.
 */
import { z } from 'astro/zod';
import {
  AUTHORSHIP_BASES,
  AUTHORSHIP_ROLES,
  CANONS,
  CONCEPT_DOMAINS,
  GURU_KINDS,
  PERSON_ROLES,
  PLACE_KINDS,
  READ_ONLINE_KINDS,
  READ_ONLINE_LICENSES,
  REFERENCE_KINDS,
  SCRIPTS,
  SLUG_PATTERN,
  STATUSES,
  SUMMARY_MAX_LENGTH,
  TEXT_GENRES,
  TRADITION_KINDS,
  VEDAS,
  VERIFICATION_LEVELS,
  type CollectionName,
} from './schema-meta';

export const dateViewSchema = z.strictObject({
  /** What readers see, e.g. "c. 8th century CE". */
  label: z.string().min(1),
  /** Sorting and timeline only; negative numbers are BCE. */
  from: z.number().int().optional(),
  to: z.number().int().optional(),
  /** Who holds this view, e.g. "Śṛṅgeri Maṭha tradition" or "Olivelle 1998". */
  source: z.string().min(1),
});

export const datingSchema = z.strictObject({
  traditional: z.array(dateViewSchema).default([]),
  academic: z.array(dateViewSchema).default([]),
  note: z.string().optional(),
});

export const referenceSchema = z.strictObject({
  kind: z.enum(REFERENCE_KINDS),
  title: z.string().min(1),
  author: z.string().optional(),
  year: z.coerce.string().optional(),
  publisher: z.string().optional(),
  /** Only URLs actually opened while writing. */
  url: z.url().optional(),
  /** Chapter, page or verse — never invented. */
  locator: z.string().optional(),
  note: z.string().optional(),
});

export const imageSchema = z.strictObject({
  src: z.string().min(1),
  alt: z.string().min(1),
  credit: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.url(),
});

/** A plain slug reference, used by the tooling in place of Astro's `reference()`. */
export const slugReference = () => z.string().regex(SLUG_PATTERN);

export function buildSchemas<R extends z.ZodType>(ref: (collection: CollectionName) => R) {
  const common = {
    title: z.string().min(1),
    roman: z.string().optional(),
    native: z.string().optional(),
    nativeScript: z.enum(SCRIPTS).default('deva'),
    aliases: z.array(z.string().min(1)).default([]),
    summary: z.string().min(1).max(SUMMARY_MAX_LENGTH),
    status: z.enum(STATUSES),
    verification: z.enum(VERIFICATION_LEVELS),
    reviewedBy: z.string().optional(),
    featured: z.boolean().default(false),
    references: z.array(referenceSchema).default([]),
    image: imageSchema.optional(),
    created: z.coerce.date(),
    updated: z.coerce.date(),
  };
  const concepts = { concepts: z.array(ref('concepts')).default([]) };

  return {
    texts: z.strictObject({
      ...common,
      ...concepts,
      genre: z.enum(TEXT_GENRES),
      canon: z.enum(CANONS),
      canonNote: z.string().optional(),
      languages: z.array(z.string().min(1)).min(1),
      veda: z.enum(VEDAS).optional(),
      shakha: z.string().optional(),
      partOf: ref('texts').optional(),
      order: z.number().optional(),
      commentsOn: ref('texts').optional(),
      authorship: z
        .array(
          z.strictObject({
            person: ref('people'),
            role: z.enum(AUTHORSHIP_ROLES),
            basis: z.enum(AUTHORSHIP_BASES),
            note: z.string().optional(),
          }),
        )
        .default([]),
      authorshipNote: z.string().optional(),
      deities: z.array(ref('deities')).default([]),
      dating: datingSchema.optional(),
      structure: z.string().optional(),
      readOnline: z
        .array(
          z.strictObject({
            label: z.string().min(1),
            url: z.url(),
            kind: z.enum(READ_ONLINE_KINDS),
            language: z.string().min(1),
            license: z.enum(READ_ONLINE_LICENSES),
          }),
        )
        .default([]),
    }),

    people: z.strictObject({
      ...common,
      ...concepts,
      roles: z.array(z.enum(PERSON_ROLES)).min(1),
      traditions: z.array(ref('traditions')).default([]),
      gurus: z
        .array(
          z.strictObject({
            person: ref('people'),
            kind: z.enum(GURU_KINDS),
            note: z.string().optional(),
          }),
        )
        .default([]),
      dating: datingSchema.optional(),
      birthplace: ref('places').optional(),
      region: z.string().optional(),
      languages: z.array(z.string().min(1)).default([]),
      living: z.boolean().default(false),
    }),

    traditions: z.strictObject({
      ...common,
      ...concepts,
      kind: z.enum(TRADITION_KINDS),
      parent: ref('traditions').optional(),
      founders: z.array(ref('people')).default([]),
      coreTexts: z.array(ref('texts')).default([]),
      deityFocus: z.array(ref('deities')).default([]),
      dating: datingSchema.optional(),
    }),

    concepts: z.strictObject({
      ...common,
      domain: z.enum(CONCEPT_DOMAINS).optional(),
      related: z.array(ref('concepts')).default([]),
      interpretations: z
        .array(z.strictObject({ tradition: ref('traditions'), summary: z.string().min(1) }))
        .default([]),
    }),

    places: z.strictObject({
      ...common,
      ...concepts,
      kind: z.enum(PLACE_KINDS),
      tags: z.array(z.string().min(1)).default([]),
      location: z.strictObject({
        region: z.string().min(1),
        country: z.string().min(1),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
      }),
      traditions: z.array(ref('traditions')).default([]),
      people: z.array(ref('people')).default([]),
      dating: datingSchema.optional(),
    }),

    deities: z.strictObject({
      ...common,
      ...concepts,
      // Deliberately non-hierarchical: contested theology belongs in prose (§6.1, rule 9).
      related: z.array(ref('deities')).default([]),
    }),
  };
}

export type CollectionSchemas = ReturnType<typeof buildSchemas>;
