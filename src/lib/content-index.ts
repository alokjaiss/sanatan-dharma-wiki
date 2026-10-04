/**
 * Reads entries straight from disk, outside Astro, for the remark plugin and the tooling.
 * Frontmatter is parsed with the same helper Astro uses, so both always see the same data.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { isCollectionName, type CollectionName } from './schema-meta';

export const CONTENT_DIR = 'src/content';

export interface RawEntry {
  collection: CollectionName;
  slug: string;
  /** Path relative to the project root, with forward slashes. */
  file: string;
  data: Record<string, unknown>;
  /** Markdown body with the frontmatter blanked out, so line numbers match the file. */
  body: string;
}

export interface Problem {
  file: string;
  line?: number;
  message: string;
}

export interface ReadResult {
  entries: RawEntry[];
  /** Files that could not be read as entries. */
  problems: Problem[];
}

export function readEntries(projectRoot = process.cwd(), contentDir = CONTENT_DIR): ReadResult {
  const entries: RawEntry[] = [];
  const problems: Problem[] = [];
  const root = resolve(projectRoot, contentDir);
  if (!existsSync(root)) return { entries, problems };

  for (const folder of readdirSync(root, { withFileTypes: true })) {
    if (folder.name.startsWith('.')) continue;
    const folderPath = `${contentDir}/${folder.name}`;
    if (!folder.isDirectory()) {
      problems.push({ file: folderPath, message: 'Entries live inside a collection folder.' });
      continue;
    }
    if (!isCollectionName(folder.name)) {
      problems.push({ file: folderPath, message: `"${folder.name}" is not a collection.` });
      continue;
    }
    const collection = folder.name;

    for (const item of readdirSync(join(root, collection), { withFileTypes: true })) {
      if (item.name.startsWith('.')) continue;
      const file = `${folderPath}/${item.name}`;
      if (item.isDirectory()) {
        problems.push({ file, message: 'Nested folders are not supported.' });
        continue;
      }
      if (!item.name.endsWith('.md')) {
        problems.push({ file, message: 'Only .md files belong in content folders.' });
        continue;
      }
      const source = readFileSync(join(root, collection, item.name), 'utf8');
      try {
        const { frontmatter, content } = parseFrontmatter(source, {
          frontmatter: 'empty-with-lines',
        });
        entries.push({
          collection,
          slug: item.name.slice(0, -'.md'.length),
          file,
          data: frontmatter as Record<string, unknown>,
          body: content,
        });
      } catch (error) {
        problems.push({ file, message: `Unreadable frontmatter: ${(error as Error).message}` });
      }
    }
  }

  entries.sort((a, b) => a.file.localeCompare(b.file));
  return { entries, problems };
}
