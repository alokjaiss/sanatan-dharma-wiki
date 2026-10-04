/**
 * Astro-side access to the whole library: every visible entry plus the relation graph.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildGraph, type Graph } from './graph';
import { COLLECTIONS, type CollectionName } from './schema-meta';

export type AnyEntry = CollectionEntry<CollectionName>;

export interface Library {
  all: AnyEntry[];
  bySlug: Map<string, AnyEntry>;
  graph: Graph;
}

export function byTitle(a: AnyEntry, b: AnyEntry): number {
  return a.data.title.localeCompare(b.data.title, 'en');
}

/** Visible entries of one collection, sorted by title. */
export function entriesOf<C extends CollectionName>(library: Library, collection: C): CollectionEntry<C>[] {
  return library.all.filter((entry) => entry.collection === collection).sort(byTitle) as CollectionEntry<C>[];
}

/** A–Z groups by the first letter of the title (diacritics ignored). */
export function groupByInitial<E extends AnyEntry>(entries: E[]): { letter: string; entries: E[] }[] {
  const groups = new Map<string, E[]>();
  for (const entry of entries) {
    const letter = entry.data.title.normalize('NFD').charAt(0).toUpperCase();
    groups.set(letter, [...(groups.get(letter) ?? []), entry]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'en'))
    .map(([letter, list]) => ({ letter, entries: list }));
}

let cached: Promise<Library> | undefined;

/** Drafts are visible in `astro dev` and excluded from production builds. */
export function loadLibrary(): Promise<Library> {
  if (import.meta.env.DEV) return assemble(); // always fresh while editing
  cached ??= assemble();
  return cached;
}

async function assemble(): Promise<Library> {
  const lists = await Promise.all(
    COLLECTIONS.map((collection) =>
      getCollection(collection, ({ data }) => import.meta.env.DEV || data.status !== 'draft'),
    ),
  );
  const all = lists.flat() as AnyEntry[];
  const graph = buildGraph(
    all.map((entry) => ({
      collection: entry.collection,
      id: entry.id,
      data: entry.data as Record<string, unknown>,
    })),
  );
  return { all, bySlug: new Map(all.map((entry) => [entry.id, entry])), graph };
}
