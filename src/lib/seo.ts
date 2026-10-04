/**
 * schema.org JSON-LD for entry pages: the page, the thing it is about, and its breadcrumbs.
 */
import { site } from '../config/site';
import type { AnyEntry } from './entries';
import { absoluteUrl, isoDate } from './format';
import { entryPath } from './paths';
import type { CollectionName } from './schema-meta';

export interface Crumb {
  label: string;
  href: string;
}

const SCHEMA_TYPE: Record<CollectionName, string> = {
  texts: 'CreativeWork',
  people: 'Person',
  traditions: 'Thing',
  concepts: 'DefinedTerm',
  places: 'Place',
  deities: 'Thing',
};

export function entryJsonLd(entry: AnyEntry, crumbs: Crumb[]): Record<string, unknown> {
  const url = absoluteUrl(entryPath(entry.collection, entry.id));
  const { title, roman, native, aliases, summary, created, updated } = entry.data;
  const about: Record<string, unknown> = {
    '@type': SCHEMA_TYPE[entry.collection],
    name: title,
    alternateName: [roman, native, ...aliases].filter(Boolean),
    description: summary,
  };
  if (entry.collection === 'texts') about.inLanguage = entry.data.languages;
  if (entry.collection === 'places') {
    const { region, country, lat, lng } = entry.data.location;
    about.address = { '@type': 'PostalAddress', addressRegion: region, addressCountry: country };
    if (lat !== undefined && lng !== undefined) {
      about.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
    }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: title,
        description: summary,
        inLanguage: 'en',
        dateCreated: isoDate(created),
        dateModified: isoDate(updated),
        license: site.license.url,
        isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
        about,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, position) => ({
          '@type': 'ListItem',
          position: position + 1,
          name: crumb.label,
          item: absoluteUrl(crumb.href),
        })),
      },
    ],
  };
}
