import type { CollectionName } from './schema-meta';

/** Canonical URL path of an entry. Every internal link to an entry goes through here. */
export function entryPath(collection: CollectionName, slug: string): string {
  return `/${collection}/${slug}/`;
}

export function collectionPath(collection: CollectionName): string {
  return `/${collection}/`;
}
