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
