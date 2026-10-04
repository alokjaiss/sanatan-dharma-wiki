/**
 * Computes every reverse view of the content (MASTER_PROMPT.md §5.3). Relations are stored
 * once in frontmatter; disciples, works, commentaries, sub-traditions and the rest are derived
 * here so they can never drift out of sync. Pure functions: no Astro imports.
 */
import type { CollectionName } from './schema-meta';

export interface GraphEntry {
  collection: CollectionName;
  id: string;
  data: Record<string, unknown>;
}

export interface WorkLink {
  text: string;
  role: string;
  basis: string;
  note?: string;
}

export interface DiscipleLink {
  person: string;
  kind: string;
  note?: string;
}

export interface DoctrineLink {
  concept: string;
  summary: string;
}

export interface Graph {
  entries: ReadonlyMap<string, GraphEntry>;
  /** text → texts that are `partOf` it, in reading order */
  contents: Map<string, string[]>;
  /** text → texts that comment on it */
  commentaries: Map<string, string[]>;
  /** person → texts they are credited with */
  works: Map<string, WorkLink[]>;
  /** deity → texts in which the deity is central */
  textsOfDeity: Map<string, string[]>;
  /** person → people who name them as a guru */
  disciples: Map<string, DiscipleLink[]>;
  /** tradition → people who belong to it */
  figures: Map<string, string[]>;
  /** place → people born there */
  bornHere: Map<string, string[]>;
  /** tradition → traditions whose `parent` it is */
  subTraditions: Map<string, string[]>;
  /** person → traditions they founded or systematised */
  founded: Map<string, string[]>;
  /** text → traditions that list it among their core texts */
  authoritativeIn: Map<string, string[]>;
  /** deity → traditions focused on the deity */
  traditionsOfDeity: Map<string, string[]>;
  /** tradition → places associated with it */
  centres: Map<string, string[]>;
  /** person → places associated with them */
  placesOfPerson: Map<string, string[]>;
  /** concept → entries that discuss it */
  discussedIn: Map<string, string[]>;
  /** concept → related concepts, in both directions */
  relatedConcepts: Map<string, string[]>;
  /** tradition → its interpretation of each concept */
  keyDoctrines: Map<string, DoctrineLink[]>;
  /** deity → related deities, in both directions */
  relatedDeities: Map<string, string[]>;
}

/** Slug of a reference: a plain slug (tooling) or Astro's `{ collection, id }`. */
export function refId(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === 'string') return id;
  }
  return undefined;
}

function refIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(refId).filter((id): id is string => id !== undefined);
}

function objects(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object');
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function add<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function buildGraph(list: readonly GraphEntry[]): Graph {
  const entries = new Map(list.map((entry) => [entry.id, entry]));
  const graph: Graph = {
    entries,
    contents: new Map(),
    commentaries: new Map(),
    works: new Map(),
    textsOfDeity: new Map(),
    disciples: new Map(),
    figures: new Map(),
    bornHere: new Map(),
    subTraditions: new Map(),
    founded: new Map(),
    authoritativeIn: new Map(),
    traditionsOfDeity: new Map(),
    centres: new Map(),
    placesOfPerson: new Map(),
    discussedIn: new Map(),
    relatedConcepts: new Map(),
    keyDoctrines: new Map(),
    relatedDeities: new Map(),
  };
  const symmetric = (map: Map<string, string[]>, a: string, b: string) => {
    if (a === b) return;
    if (!map.get(a)?.includes(b)) add(map, a, b);
    if (!map.get(b)?.includes(a)) add(map, b, a);
  };

  for (const { collection, id, data } of list) {
    if (collection !== 'concepts') {
      for (const concept of refIds(data.concepts)) add(graph.discussedIn, concept, id);
    }

    switch (collection) {
      case 'texts': {
        const parent = refId(data.partOf);
        if (parent) add(graph.contents, parent, id);
        const root = refId(data.commentsOn);
        if (root) add(graph.commentaries, root, id);
        for (const credit of objects(data.authorship)) {
          const person = refId(credit.person);
          if (!person) continue;
          add(graph.works, person, {
            text: id,
            role: String(credit.role ?? 'author'),
            basis: String(credit.basis ?? 'traditional'),
            note: optionalString(credit.note),
          });
        }
        for (const deity of refIds(data.deities)) add(graph.textsOfDeity, deity, id);
        break;
      }
      case 'people': {
        for (const tradition of refIds(data.traditions)) add(graph.figures, tradition, id);
        for (const guru of objects(data.gurus)) {
          const person = refId(guru.person);
          if (!person) continue;
          add(graph.disciples, person, {
            person: id,
            kind: String(guru.kind ?? 'diksha'),
            note: optionalString(guru.note),
          });
        }
        const birthplace = refId(data.birthplace);
        if (birthplace) add(graph.bornHere, birthplace, id);
        break;
      }
      case 'traditions': {
        const parent = refId(data.parent);
        if (parent) add(graph.subTraditions, parent, id);
        for (const founder of refIds(data.founders)) add(graph.founded, founder, id);
        for (const text of refIds(data.coreTexts)) add(graph.authoritativeIn, text, id);
        for (const deity of refIds(data.deityFocus)) add(graph.traditionsOfDeity, deity, id);
        break;
      }
      case 'concepts': {
        for (const related of refIds(data.related)) symmetric(graph.relatedConcepts, id, related);
        for (const reading of objects(data.interpretations)) {
          const tradition = refId(reading.tradition);
          if (!tradition) continue;
          add(graph.keyDoctrines, tradition, { concept: id, summary: String(reading.summary ?? '') });
        }
        break;
      }
      case 'places': {
        for (const tradition of refIds(data.traditions)) add(graph.centres, tradition, id);
        for (const person of refIds(data.people)) add(graph.placesOfPerson, person, id);
        break;
      }
      case 'deities': {
        for (const related of refIds(data.related)) symmetric(graph.relatedDeities, id, related);
        break;
      }
    }
  }

  const byTitle = (a: string, b: string) => titleOf(graph, a).localeCompare(titleOf(graph, b), 'en');
  const byOrder = (a: string, b: string) => {
    const orderA = entries.get(a)?.data.order;
    const orderB = entries.get(b)?.data.order;
    const numA = typeof orderA === 'number' ? orderA : Number.POSITIVE_INFINITY;
    const numB = typeof orderB === 'number' ? orderB : Number.POSITIVE_INFINITY;
    return numA === numB ? byTitle(a, b) : numA - numB;
  };

  for (const list of graph.contents.values()) list.sort(byOrder);
  for (const map of [
    graph.commentaries,
    graph.textsOfDeity,
    graph.figures,
    graph.bornHere,
    graph.subTraditions,
    graph.founded,
    graph.authoritativeIn,
    graph.traditionsOfDeity,
    graph.centres,
    graph.placesOfPerson,
    graph.discussedIn,
    graph.relatedConcepts,
    graph.relatedDeities,
  ]) {
    for (const list of map.values()) list.sort(byTitle);
  }
  for (const list of graph.works.values()) list.sort((a, b) => byTitle(a.text, b.text));
  for (const list of graph.disciples.values()) list.sort((a, b) => byTitle(a.person, b.person));
  for (const list of graph.keyDoctrines.values()) list.sort((a, b) => byTitle(a.concept, b.concept));

  return graph;
}

export function titleOf(graph: Graph, slug: string): string {
  const title = graph.entries.get(slug)?.data.title;
  return typeof title === 'string' ? title : slug;
}

/**
 * The line of teachers above a person, earliest first, ending with the person.
 * At each step it follows the first dīkṣā guru, else the first lineage predecessor, else the
 * first guru listed. Stops at cycles and at `maxDepth`.
 */
export function guruChain(graph: Graph, slug: string, maxDepth = 40): string[] {
  const chain = [slug];
  const seen = new Set(chain);
  let current = slug;
  while (chain.length <= maxDepth) {
    const gurus = objects(graph.entries.get(current)?.data.gurus);
    const next =
      gurus.find((guru) => guru.kind === 'diksha') ??
      gurus.find((guru) => guru.kind === 'lineage') ??
      gurus[0];
    const nextSlug = next ? refId(next.person) : undefined;
    if (!nextSlug || seen.has(nextSlug) || !graph.entries.has(nextSlug)) break;
    chain.unshift(nextSlug);
    seen.add(nextSlug);
    current = nextSlug;
  }
  return chain;
}

/** Containing entries, outermost first: a text's `partOf` chain or a tradition's `parent` chain. */
export function ancestors(graph: Graph, slug: string): string[] {
  const entry = graph.entries.get(slug);
  if (!entry) return [];
  const field = entry.collection === 'texts' ? 'partOf' : entry.collection === 'traditions' ? 'parent' : undefined;
  if (!field) return [];
  const chain: string[] = [];
  const seen = new Set([slug]);
  let current = refId(entry.data[field]);
  while (current && !seen.has(current) && graph.entries.has(current)) {
    chain.unshift(current);
    seen.add(current);
    current = refId(graph.entries.get(current)?.data[field]);
  }
  return chain;
}

/** The texts before and after this one inside the same parent. */
export function siblings(graph: Graph, slug: string): { previous?: string; next?: string } {
  const parent = refId(graph.entries.get(slug)?.data.partOf);
  const list = parent ? graph.contents.get(parent) : undefined;
  if (!list) return {};
  const position = list.indexOf(slug);
  return { previous: list[position - 1], next: list[position + 1] };
}
