/**
 * Integrity checks that schemas alone can't express (MASTER_PROMPT.md §8). Pure: takes raw
 * entries and returns findings. `scripts/validate-content.ts` is the command-line wrapper.
 */
import type { Problem, RawEntry } from './content-index';
import { findWikilinks } from './remark-wikilinks';
import { buildSchemas, slugReference } from './schemas';
import {
  COLLECTIONS,
  MIN_PUBLISHED_REFERENCES,
  RELATIONS,
  REQUIRED_SECTION_COUNT,
  SLUG_PATTERN,
  TEMPLATES,
  isCollectionName,
  type CollectionName,
} from './schema-meta';
import { anusvaraVariant, hasIastDiacritics, isIndic, isNfc } from './text';

export type Level = 'error' | 'warning';

export interface Finding extends Problem {
  level: Level;
}

export interface ValidationResult {
  errors: Finding[];
  warnings: Finding[];
}

export interface ValidateOptions {
  /** "Now", for the staleness warning. */
  today?: Date;
}

const schemas = buildSchemas(() => slugReference());

/** Uncited Indic-script runs longer than this many words are treated as quotations. */
const MAX_UNCITED_INDIC_WORDS = 3;
/** Italic runs with IAST diacritics of at least this many words are treated as quotations. */
const MAX_UNCITED_ITALIC_WORDS = 6;
const STALE_AFTER_DAYS = 365;
const PLACEHOLDER = /<[^<>\n]{2,}>/;

export function validateEntries(
  entries: readonly RawEntry[],
  options: ValidateOptions = {},
): ValidationResult {
  const findings: Finding[] = [];
  const error = (file: string, message: string, line?: number) =>
    findings.push({ level: 'error', file, line, message });
  const warn = (file: string, message: string, line?: number) =>
    findings.push({ level: 'warning', file, line, message });

  // ── Slugs ─────────────────────────────────────────────────────────────────────
  const bySlug = new Map<string, RawEntry>();
  for (const entry of entries) {
    if (!SLUG_PATTERN.test(entry.slug)) {
      error(entry.file, `File name "${entry.slug}" isn't a valid slug (lowercase ASCII words joined by hyphens).`);
    }
    const existing = bySlug.get(entry.slug);
    if (existing) {
      error(entry.file, `Slug "${entry.slug}" is already used by ${existing.file}. Slugs must be unique across all collections.`);
      continue;
    }
    bySlug.set(entry.slug, entry);
  }

  const allowedNativeNames = collectNativeNames(entries);
  const inbound = new Map<string, number>();
  const countInbound = (slug: string) => inbound.set(slug, (inbound.get(slug) ?? 0) + 1);

  for (const entry of entries) {
    const { file, data } = entry;
    const status = String(data.status ?? '');
    const isDraft = status === 'draft';

    // ── Schema ──────────────────────────────────────────────────────────────────
    const parsed = schemas[entry.collection].safeParse(data);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const path = issue.path.map(String).join('.') || 'frontmatter';
        error(file, `${path}: ${issue.message}`);
      }
    }

    // ── Unicode and placeholders ────────────────────────────────────────────────
    const strings = collectStrings(data);
    const notNfc = strings.filter(([, value]) => !isNfc(value)).map(([path]) => path);
    if (notNfc.length > 0 || !isNfc(entry.body)) {
      const where = [...notNfc, ...(isNfc(entry.body) ? [] : ['body'])].join(', ');
      error(file, `Text isn't Unicode NFC-normalised (${where}). Re-save it in NFC so search and links match.`);
    }
    if (!isDraft) {
      for (const [path, value] of strings) {
        if (PLACEHOLDER.test(value)) error(file, `${path} still contains placeholder text: "${value}".`);
      }
    }

    // ── Relations ───────────────────────────────────────────────────────────────
    for (const spec of RELATIONS[entry.collection]) {
      for (const target of relationSlugs(data[spec.field], spec.key)) {
        const label = spec.key ? `${spec.field}[].${spec.key}` : spec.field;
        const found = bySlug.get(target);
        if (!found) {
          error(file, `${label} → "${target}" has no entry. Fix the slug or create a stub.`);
          continue;
        }
        countInbound(target);
        if (found.collection !== spec.target) {
          error(file, `${label} → "${target}" is in ${found.collection}, but ${label} must point to ${spec.target}.`);
        }
        if (target === entry.slug) error(file, `${label} points at the entry itself.`);
        if (!isDraft && found.data.status === 'draft') {
          error(file, `${label} → "${target}" is a draft, which is hidden in production. Publish it, make it a stub, or remove the link.`);
        }
      }
    }

    // ── Body ────────────────────────────────────────────────────────────────────
    const lines = bodyLines(entry.body);
    for (const line of lines) {
      if (line.inCode) continue;
      for (const link of findWikilinks(line.text)) {
        const found = bySlug.get(link.slug);
        if (!found) {
          error(file, `Wikilink [[${link.slug}]] has no entry. Fix the slug or create a stub.`, line.line);
          continue;
        }
        if (link.slug !== entry.slug) countInbound(link.slug);
        if (!isDraft && found.data.status === 'draft') {
          error(file, `Wikilink [[${link.slug}]] points to a draft, which is hidden in production.`, line.line);
        }
      }
    }
    for (const finding of verseGuard(lines, allowedNativeNames)) error(file, finding.message, finding.line);

    // ── Publishing rules ────────────────────────────────────────────────────────
    const references = Array.isArray(data.references) ? (data.references as Record<string, unknown>[]) : [];
    if (status === 'published') {
      if (references.length < MIN_PUBLISHED_REFERENCES) {
        error(file, `Published entries need at least ${MIN_PUBLISHED_REFERENCES} references (found ${references.length}).`);
      }
      if (entry.collection === 'texts' && !references.some((ref) => ref?.kind === 'primary')) {
        error(file, 'Published texts need at least one primary reference (an edition or e-text of the text itself).');
      }
      const missing = missingSections(entry.collection, lines);
      if (missing.length > 0) {
        error(file, `Missing template section(s): ${missing.map((title) => `"## ${title}"`).join(', ')}.`);
      }
      if (data.nativeScript !== 'latn' && (!data.roman || !data.native)) {
        error(file, 'Published entries need `roman` (IAST / ISO 15919) and `native` (native script) names.');
      }
    } else if (status === 'stub' && references.length === 0) {
      warn(file, 'Stub has no references; add at least one source for its summary.');
    }

    // ── Dates and verification ──────────────────────────────────────────────────
    const dating = data.dating as Record<string, unknown> | undefined;
    for (const view of ['traditional', 'academic'] as const) {
      const list = Array.isArray(dating?.[view]) ? (dating[view] as Record<string, unknown>[]) : [];
      list.forEach((date, position) => {
        if (typeof date?.from === 'number' && typeof date?.to === 'number' && date.from > date.to) {
          error(file, `dating.${view}[${position}]: from (${date.from}) is later than to (${date.to}).`);
        }
      });
    }
    if (data.verification === 'expert-verified' && !data.reviewedBy) {
      error(file, 'expert-verified entries must name the reviewer in `reviewedBy`.');
    }

    // ── Warnings ────────────────────────────────────────────────────────────────
    const updated = data.updated instanceof Date ? data.updated : new Date(String(data.updated));
    const today = options.today ?? new Date();
    if (!Number.isNaN(updated.getTime()) && daysBetween(updated, today) > STALE_AFTER_DAYS) {
      warn(file, `Not updated for over a year (last updated ${updated.toISOString().slice(0, 10)}).`);
    }
    if (typeof data.summary === 'string' && typeof data.title === 'string') {
      const compact = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      if (compact(data.summary) === compact(data.title)) warn(file, 'Summary only repeats the title.');
    }
  }

  // ── Cycles ────────────────────────────────────────────────────────────────────
  for (const [collection, field, key] of [
    ['texts', 'partOf', undefined],
    ['traditions', 'parent', undefined],
    ['people', 'gurus', 'person'],
  ] as const) {
    for (const slug of findCycles(entries, collection, field, key)) {
      error(bySlug.get(slug)?.file ?? slug, `"${slug}" is part of a ${field} cycle.`);
    }
  }

  // ── Stubs readers keep landing on ─────────────────────────────────────────────
  for (const entry of entries) {
    const count = inbound.get(entry.slug) ?? 0;
    if (entry.data.status === 'stub' && count >= 3) {
      warn(entry.file, `Stub with ${count} inbound links; worth writing in full.`);
    }
  }

  return {
    errors: findings.filter((finding) => finding.level === 'error'),
    warnings: findings.filter((finding) => finding.level === 'warning'),
  };
}

// ── Backlog ─────────────────────────────────────────────────────────────────────

const BACKLOG_STATUSES = ['todo', 'done', 'blocked'];

export function validateBacklog(
  items: unknown,
  entries: readonly RawEntry[],
  file = 'backlog/content.yaml',
): ValidationResult {
  const errors: Finding[] = [];
  const warnings: Finding[] = [];
  if (!Array.isArray(items)) {
    errors.push({ level: 'error', file, message: 'The backlog must be a YAML list.' });
    return { errors, warnings };
  }
  const existing = new Map(entries.map((entry) => [entry.slug, entry]));
  const seen = new Set<string>();
  items.forEach((raw, position) => {
    const where = `item ${position + 1}`;
    const item = (raw ?? {}) as Record<string, unknown>;
    const slug = String(item.slug ?? '');
    if (!SLUG_PATTERN.test(slug)) errors.push({ level: 'error', file, message: `${where}: invalid slug "${slug}".` });
    if (seen.has(slug)) errors.push({ level: 'error', file, message: `${where}: "${slug}" is listed twice.` });
    seen.add(slug);
    if (!isCollectionName(String(item.collection ?? ''))) {
      errors.push({ level: 'error', file, message: `${where}: collection must be one of ${COLLECTIONS.join(', ')}.` });
    }
    if (!item.title) errors.push({ level: 'error', file, message: `${where}: missing title.` });
    if (!BACKLOG_STATUSES.includes(String(item.status))) {
      errors.push({ level: 'error', file, message: `${where}: status must be todo, done or blocked.` });
    }
    const entry = existing.get(slug);
    if (item.status === 'todo' && entry?.data.status === 'published') {
      warnings.push({ level: 'warning', file, message: `${where}: "${slug}" is already published; mark it done.` });
    }
    if (entry && item.collection && entry.collection !== item.collection) {
      errors.push({ level: 'error', file, message: `${where}: "${slug}" exists in ${entry.collection}, not ${String(item.collection)}.` });
    }
  });
  return { errors, warnings };
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

interface BodyLine {
  text: string;
  line: number;
  inCode: boolean;
}

/** Body lines with code fences flagged and inline code blanked out. */
export function bodyLines(body: string): BodyLine[] {
  let fence: string | undefined;
  return body.split(/\r?\n/).map((text, index) => {
    const marker = text.trimStart().match(/^(`{3,}|~{3,})/)?.[1];
    if (fence) {
      if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
      return { text, line: index + 1, inCode: true };
    }
    if (marker) {
      fence = marker;
      return { text, line: index + 1, inCode: true };
    }
    return { text: text.replace(/`[^`]*`/g, (code) => ' '.repeat(code.length)), line: index + 1, inCode: false };
  });
}

function missingSections(collection: CollectionName, lines: BodyLine[]): string[] {
  const normalise = (value: string) => value.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  const present = new Set(
    lines
      .filter((line) => !line.inCode)
      .map((line) => line.text.match(/^##\s+(.+?)\s*#*\s*$/)?.[1])
      .filter((title): title is string => Boolean(title))
      .map(normalise),
  );
  return TEMPLATES[collection]
    .slice(0, REQUIRED_SECTION_COUNT)
    .filter((title) => !present.has(normalise(title)));
}

/**
 * Flags original-language passages that aren't inside a cited blockquote: runs of more than
 * three Indic-script words, or italic runs of six or more words with IAST diacritics. A
 * blockquote counts as cited when its last line starts with "—" and carries a footnote.
 */
export function verseGuard(lines: BodyLine[], allowedNames: readonly string[]): { line: number; message: string }[] {
  const findings: { line: number; message: string }[] = [];
  for (const block of blocks(lines)) {
    const isQuote = block.every((line) => line.text.trimStart().startsWith('>'));
    if (isQuote) {
      const last = block[block.length - 1].text.replace(/^\s*(>\s*)+/, '').trim();
      if ((last.startsWith('—') || last.startsWith('--')) && last.includes('[^')) continue;
    }
    let run = 0;
    let runStart = 0;
    for (const line of block) {
      let text = line.text;
      for (const name of allowedNames) text = text.split(name).join(' ');
      for (const word of text.split(/\s+/).filter(Boolean)) {
        if (isIndic(word)) {
          if (run === 0) runStart = line.line;
          run += 1;
          if (run === MAX_UNCITED_INDIC_WORDS + 1) {
            findings.push({
              line: runStart,
              message: 'Original-language passage outside a cited blockquote. Quote it as a blockquote ending in "— Text locator[^n]", or paraphrase.',
            });
          }
        } else {
          run = 0;
        }
      }
      // Footnote definitions hold citations, whose italic titles are not quotations.
      if (/^\s*\[\^[^\]]+\]:/.test(line.text)) continue;
      for (const match of line.text.matchAll(/(?<![*_\p{L}\p{N}])([*_])(?![*_\s])(.+?)(?<![\s*_])\1(?![*_\p{L}\p{N}])/gu)) {
        const words = match[2].split(/\s+/).filter(Boolean);
        if (words.length >= MAX_UNCITED_ITALIC_WORDS && looksLikeSanskrit(words)) {
          findings.push({
            line: line.line,
            message: 'Long italic IAST passage outside a cited blockquote. Quote it in a cited blockquote, or paraphrase.',
          });
        }
      }
    }
  }
  return findings;
}

const ENGLISH_FUNCTION_WORDS = new Set(['the', 'of', 'and', 'with', 'by', 'in', 'a', 'an', 'to', 'on', 'for', 'from', 'is', 'as']);

/** A run of IAST words with diacritics and almost no English, as opposed to an italic book title. */
function looksLikeSanskrit(words: string[]): boolean {
  const lower = words.map((word) => word.toLowerCase().replace(/[^\p{L}']/gu, ''));
  const english = lower.filter((word) => ENGLISH_FUNCTION_WORDS.has(word)).length;
  const diacritic = words.filter((word) => hasIastDiacritics(word)).length;
  return english < 2 && diacritic >= 2;
}

function blocks(lines: BodyLine[]): BodyLine[][] {
  const result: BodyLine[][] = [];
  let current: BodyLine[] = [];
  for (const line of lines) {
    if (line.inCode || line.text.trim() === '') {
      if (current.length > 0) result.push(current);
      current = [];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) result.push(current);
  return result;
}

/** Native-script names of every entry (and their anusvāra spellings), longest first. */
function collectNativeNames(entries: readonly RawEntry[]): string[] {
  const names = new Set<string>();
  for (const { data } of entries) {
    const candidates = [data.native, ...(Array.isArray(data.aliases) ? data.aliases : [])];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && isIndic(candidate)) {
        names.add(candidate);
        names.add(anusvaraVariant(candidate));
      }
    }
  }
  return [...names].sort((a, b) => b.length - a.length);
}

function relationSlugs(value: unknown, key?: string): string[] {
  const items = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  return items
    .map((item) => (key && item && typeof item === 'object' ? (item as Record<string, unknown>)[key] : item))
    .filter((slug): slug is string => typeof slug === 'string');
}

function collectStrings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path || 'value', value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.entries(value).flatMap(([key, item]) => collectStrings(item, path ? `${path}.${key}` : key));
  }
  return [];
}

function findCycles(
  entries: readonly RawEntry[],
  collection: CollectionName,
  field: string,
  key?: string,
): string[] {
  const edges = new Map<string, string[]>();
  for (const entry of entries) {
    if (entry.collection === collection) edges.set(entry.slug, relationSlugs(entry.data[field], key));
  }
  const state = new Map<string, 'visiting' | 'done'>();
  const inCycle = new Set<string>();
  const visit = (slug: string, stack: string[]) => {
    state.set(slug, 'visiting');
    stack.push(slug);
    for (const next of edges.get(slug) ?? []) {
      if (state.get(next) === 'visiting') {
        for (const member of stack.slice(stack.indexOf(next))) inCycle.add(member);
      } else if (!state.has(next) && edges.has(next)) {
        visit(next, stack);
      }
    }
    stack.pop();
    state.set(slug, 'done');
  };
  for (const slug of edges.keys()) if (!state.has(slug)) visit(slug, []);
  return [...inCycle];
}

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 86_400_000;
}
