import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { buildSchemas } from './lib/schemas';

const schemas = buildSchemas((collection) => reference(collection));

// One Markdown file per entry; the file name is the slug.
const entries = (name: keyof typeof schemas) =>
  glob({ pattern: '*.md', base: `./src/content/${name}` });

export const collections = {
  texts: defineCollection({ loader: entries('texts'), schema: schemas.texts }),
  people: defineCollection({ loader: entries('people'), schema: schemas.people }),
  traditions: defineCollection({ loader: entries('traditions'), schema: schemas.traditions }),
  concepts: defineCollection({ loader: entries('concepts'), schema: schemas.concepts }),
  places: defineCollection({ loader: entries('places'), schema: schemas.places }),
  deities: defineCollection({ loader: entries('deities'), schema: schemas.deities }),
};
