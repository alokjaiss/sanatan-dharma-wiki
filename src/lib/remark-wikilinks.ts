/**
 * Turns `[[slug]]` and `[[slug|label]]` into links to entries. Unknown slugs render as a
 * marked span instead of breaking the build; `npm run validate` reports them as errors.
 */
import type { Link, PhrasingContent, Root, Text } from 'mdast';
import { SKIP, visit } from 'unist-util-visit';
import { readEntries } from './content-index';
import { entryPath } from './paths';
import type { CollectionName } from './schema-meta';

export const WIKILINK_PATTERN = /\[\[([^[\]|]+?)(?:\|([^[\]]+?))?\]\]/g;

export interface WikiTarget {
  collection: CollectionName;
  title: string;
  status: string;
}
export type WikiIndex = ReadonlyMap<string, WikiTarget>;

export interface WikilinkMatch {
  slug: string;
  label?: string;
  index: number;
  length: number;
}

/** Every wikilink in a string, in order. */
export function findWikilinks(value: string): WikilinkMatch[] {
  return Array.from(value.matchAll(WIKILINK_PATTERN), (match) => ({
    slug: match[1].trim(),
    label: match[2]?.trim(),
    index: match.index,
    length: match[0].length,
  }));
}

/** Builds the slug → target index from the entries on disk. */
export function indexFromDisk(projectRoot = process.cwd()): Map<string, WikiTarget> {
  const index = new Map<string, WikiTarget>();
  for (const entry of readEntries(projectRoot).entries) {
    index.set(entry.slug, {
      collection: entry.collection,
      title: String(entry.data.title ?? entry.slug),
      status: String(entry.data.status ?? ''),
    });
  }
  return index;
}

export interface RemarkWikilinksOptions {
  /** Supplies the index; defaults to reading `src/content` (re-read when a slug is unknown). */
  index?: () => WikiIndex;
}

export function remarkWikilinks(options: RemarkWikilinksOptions = {}) {
  let cached: WikiIndex | undefined;
  const lookup = (slug: string): WikiTarget | undefined => {
    if (options.index) return options.index().get(slug);
    cached ??= indexFromDisk();
    if (!cached.has(slug)) cached = indexFromDisk(); // picks up entries added during `astro dev`
    return cached.get(slug);
  };

  return (tree: Root) => {
    visit(tree, 'text', (node: Text, position, parent) => {
      if (!parent || position === undefined) return;
      if (parent.type === 'link' || parent.type === 'linkReference') return;
      const matches = findWikilinks(node.value);
      if (matches.length === 0) return;

      const replacement: PhrasingContent[] = [];
      let cursor = 0;
      for (const match of matches) {
        if (match.index > cursor) {
          replacement.push({ type: 'text', value: node.value.slice(cursor, match.index) });
        }
        replacement.push(toNode(match, lookup(match.slug)));
        cursor = match.index + match.length;
      }
      if (cursor < node.value.length) {
        replacement.push({ type: 'text', value: node.value.slice(cursor) });
      }

      parent.children.splice(position, 1, ...replacement);
      return [SKIP, position + replacement.length];
    });
  };
}

function toNode(match: WikilinkMatch, target: WikiTarget | undefined): PhrasingContent {
  if (!target) {
    // Rendered as <span class="wikilink-missing"> via data.hName.
    return {
      type: 'emphasis',
      data: {
        hName: 'span',
        hProperties: { className: ['wikilink-missing'], title: 'No entry yet' },
      },
      children: [{ type: 'text', value: match.label ?? match.slug }],
    };
  }
  const link: Link = {
    type: 'link',
    url: entryPath(target.collection, match.slug),
    children: [{ type: 'text', value: match.label ?? target.title }],
    data: {
      hProperties: {
        className: target.status === 'stub' ? ['wikilink', 'wikilink-stub'] : ['wikilink'],
      },
    },
  };
  return link;
}
