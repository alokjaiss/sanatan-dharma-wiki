import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { describe, expect, it } from 'vitest';
import { findWikilinks, remarkWikilinks, type WikiTarget } from './remark-wikilinks';

const index = new Map<string, WikiTarget>([
  ['adi-shankaracharya', { collection: 'people', title: 'Adi Shankaracharya', status: 'published' }],
  ['vyasa', { collection: 'people', title: 'Vyasa', status: 'stub' }],
]);

async function render(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikilinks, { index: () => index })
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

describe('findWikilinks', () => {
  it('finds slugs and labels', () => {
    expect(findWikilinks('See [[vyasa]] and [[adi-shankaracharya|Śaṅkara]].')).toEqual([
      { slug: 'vyasa', label: undefined, index: 4, length: 9 },
      { slug: 'adi-shankaracharya', label: 'Śaṅkara', index: 18, length: 30 },
    ]);
  });
});

describe('remarkWikilinks', () => {
  it('links with a custom label', async () => {
    const html = await render('Taught by [[adi-shankaracharya|Śaṅkara]].');
    expect(html).toContain('<a href="/people/adi-shankaracharya/" class="wikilink">Śaṅkara</a>');
  });

  it("falls back to the entry's title and marks stubs", async () => {
    const html = await render('Compiled by [[vyasa]].');
    expect(html).toContain('<a href="/people/vyasa/" class="wikilink wikilink-stub">Vyasa</a>');
  });

  it('renders unknown slugs as a marked span', async () => {
    const html = await render('A [[nobody|missing figure]] here.');
    expect(html).toContain('<span class="wikilink-missing" title="No entry yet">missing figure</span>');
  });

  it('leaves code alone and works inside emphasis', async () => {
    const html = await render('`[[vyasa]]` and *by [[vyasa]]*');
    expect(html).toContain('<code>[[vyasa]]</code>');
    expect(html).toContain('<em>by <a href="/people/vyasa/" class="wikilink wikilink-stub">Vyasa</a></em>');
  });
});
