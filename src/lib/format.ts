/**
 * Presentation helpers shared by templates: labels, dates, citations and links.
 */
import { site } from '../config/site';
import { hasMessage, t } from '../i18n';
import type { CollectionName } from './schema-meta';
import { humanize } from './text';

/** Display label for an enum value, e.g. label('genre', 'itihasa') → "Itihāsa". */
export function label(group: string, value: string): string {
  const key = `enum.${group}.${value}`;
  return hasMessage(key) ? t(key) : humanize(value);
}

export function collectionLabel(collection: CollectionName, count: 'one' | 'many' = 'many'): string {
  return count === 'one' ? t(`collection.${collection}.one`) : t(`collection.${collection}`);
}

export function countLabel(count: number): string {
  return count === 1 ? t('collection.countOne') : t('collection.count', { count });
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface ReferenceData {
  kind: string;
  title: string;
  author?: string;
  year?: string;
  publisher?: string;
  url?: string;
  locator?: string;
  note?: string;
}

/** "Author (Year)" or whichever parts exist. */
export function referenceLead(ref: ReferenceData): string {
  if (ref.author && ref.year) return `${ref.author} (${ref.year})`;
  return ref.author ?? ref.year ?? '';
}

export function editUrl(collection: CollectionName, slug: string): string {
  return `${site.repo.url}/edit/${site.repo.branch}/src/content/${collection}/${slug}.md`;
}

export function reportUrl(title: string, pageUrl: string): string {
  const params = new URLSearchParams({
    template: 'correction.yml',
    title: `Correction: ${title}`,
    entry: pageUrl,
  });
  return `${site.repo.url}/issues/new?${params.toString()}`;
}

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
