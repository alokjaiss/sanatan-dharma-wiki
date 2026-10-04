import { describe, expect, it } from 'vitest';
import type { RawEntry } from './content-index';
import type { CollectionName } from './schema-meta';
import { validateBacklog, validateEntries } from './validate';

const today = new Date('2026-10-04');

function entry(collection: CollectionName, slug: string, data: Record<string, unknown>, body = ''): RawEntry {
  return { collection, slug, file: `src/content/${collection}/${slug}.md`, data, body };
}

const names = { roman: 'Name', native: 'नाम', nativeScript: 'deva' };
const dates = { created: today, updated: today };
const threeReferences = [
  { kind: 'primary', title: 'E-text', url: 'https://example.org/etext' },
  { kind: 'secondary', title: 'A study', author: 'Someone', year: 2001 },
  { kind: 'tertiary', title: 'An encyclopedia article' },
];

const stubPerson = (slug: string, extra: Record<string, unknown> = {}) =>
  entry('people', slug, {
    title: slug,
    ...names,
    summary: `${slug} is a person used in tests.`,
    status: 'stub',
    verification: 'ai-draft',
    roles: ['acharya'],
    references: [threeReferences[2]],
    ...dates,
    ...extra,
  });

const publishedTextBody = [
  '## Overview',
  '',
  'Credited to [[vyasa]].[^1]',
  '',
  '## Structure and contents',
  '',
  'Eighteen chapters.',
  '',
  '## Key teachings',
  '',
  'Action without attachment.',
  '',
  '[^1]: A study, p. 1.',
].join('\n');

const publishedText = (extra: Record<string, unknown> = {}, body = publishedTextBody) =>
  entry(
    'texts',
    'some-text',
    {
      title: 'Some Text',
      ...names,
      summary: 'A text used by the validator tests.',
      status: 'published',
      verification: 'ai-draft',
      genre: 'itihasa',
      canon: 'smriti',
      languages: ['sanskrit'],
      authorship: [{ person: 'vyasa', role: 'author', basis: 'traditional' }],
      references: threeReferences,
      ...dates,
      ...extra,
    },
    body,
  );

const messages = (entries: RawEntry[]) =>
  validateEntries(entries, { today }).errors.map((finding) => finding.message);

describe('validateEntries', () => {
  it('accepts a complete published entry', () => {
    const result = validateEntries([publishedText(), stubPerson('vyasa')], { today });
    expect(result.errors).toEqual([]);
  });

  it('reports schema problems with the field path', () => {
    const errors = messages([publishedText({ canon: 'apocrypha' }), stubPerson('vyasa')]);
    expect(errors.some((message) => message.startsWith('canon:'))).toBe(true);
  });

  it('reports unknown wikilinks with their line', () => {
    const result = validateEntries([publishedText({}, `${publishedTextBody}\n\nSee [[nobody]].`), stubPerson('vyasa')], { today });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ line: 15, message: expect.stringContaining('[[nobody]]') }),
    );
  });

  it('reports missing and mis-typed relation targets', () => {
    const errors = messages([
      publishedText({ partOf: 'missing-epic', commentsOn: 'vyasa' }),
      stubPerson('vyasa'),
    ]);
    expect(errors).toContainEqual(expect.stringContaining('partOf → "missing-epic" has no entry'));
    expect(errors).toContainEqual(expect.stringContaining('must point to texts'));
  });

  it('rejects duplicate slugs across collections', () => {
    const errors = messages([publishedText(), stubPerson('vyasa'), stubPerson('some-text')]);
    expect(errors).toContainEqual(expect.stringContaining('already used'));
  });

  it('enforces references and template sections on published entries', () => {
    const errors = messages([
      publishedText({ references: threeReferences.slice(1) }, '## Overview\n\nOnly one section.'),
      stubPerson('vyasa'),
    ]);
    expect(errors).toContainEqual(expect.stringContaining('at least 3 references'));
    expect(errors).toContainEqual(expect.stringContaining('primary reference'));
    expect(errors).toContainEqual(expect.stringContaining('"## Structure and contents"'));
  });

  it('flags uncited original-language passages but allows cited quotations and names', () => {
    const uncited = `${publishedTextBody}\n\nकर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।`;
    expect(messages([publishedText({}, uncited), stubPerson('vyasa')])).toContainEqual(
      expect.stringContaining('Original-language passage'),
    );

    const cited = `${publishedTextBody}\n\n> कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\n> — Bhagavad Gītā 2.47[^1]`;
    expect(messages([publishedText({}, cited), stubPerson('vyasa')])).toEqual([]);

    const longName = 'श्री शारदा पीठम् शृङ्गेरी';
    const named = `${publishedTextBody}\n\nThe maṭha (${longName}) is old.`;
    expect(messages([publishedText({ aliases: [longName] }, named), stubPerson('vyasa')])).toEqual([]);

    const italic = `${publishedTextBody}\n\nThe sūtra says *athāto brahmajijñāsā janmādy asya yataḥ śāstrayonitvāt* here.`;
    expect(messages([publishedText({}, italic), stubPerson('vyasa')])).toContainEqual(
      expect.stringContaining('Long italic IAST passage'),
    );
  });

  it('detects cycles', () => {
    const errors = messages([
      stubPerson('a', { gurus: [{ person: 'b', kind: 'diksha' }] }),
      stubPerson('b', { gurus: [{ person: 'a', kind: 'diksha' }] }),
    ]);
    expect(errors.filter((message) => message.includes('gurus cycle'))).toHaveLength(2);
  });

  it('requires NFC text and rejects placeholders outside drafts', () => {
    const decomposed = stubPerson('vyasa', { summary: 'Vyāsa compiled the Vedas.'.normalize('NFD') });
    expect(messages([decomposed])).toContainEqual(expect.stringContaining('NFC'));

    expect(messages([stubPerson('vyasa', { roman: '<IAST>' })])).toContainEqual(
      expect.stringContaining('placeholder'),
    );
    expect(messages([stubPerson('vyasa', { roman: '<IAST>', status: 'draft' })])).toEqual([]);
  });

  it('rejects links from visible entries to drafts', () => {
    const errors = messages([publishedText(), stubPerson('vyasa', { status: 'draft' })]);
    expect(errors).toContainEqual(expect.stringContaining('draft'));
  });

  it('checks dates and expert verification', () => {
    const errors = messages([
      stubPerson('vyasa', {
        verification: 'expert-verified',
        dating: { traditional: [], academic: [{ label: 'c. 500', from: 500, to: 400, source: 'Test' }] },
      }),
    ]);
    expect(errors).toContainEqual(expect.stringContaining('is later than'));
    expect(errors).toContainEqual(expect.stringContaining('reviewedBy'));
  });

  it('warns about stubs that many entries link to', () => {
    // Each text points at the stub twice: through `authorship` and through a wikilink.
    const texts = ['one', 'two', 'three'].map((slug) => ({
      ...publishedText(),
      slug,
      file: `src/content/texts/${slug}.md`,
    }));
    const result = validateEntries([...texts, stubPerson('vyasa')], { today });
    expect(result.warnings).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('Stub with 6 inbound links') }),
    );
  });
});

describe('validateBacklog', () => {
  it('checks slugs, statuses, duplicates and finished work', () => {
    const result = validateBacklog(
      [
        { slug: 'some-text', collection: 'texts', title: 'Some Text', tier: 1, status: 'todo' },
        { slug: 'some-text', collection: 'texts', title: 'Again', tier: 1, status: 'todo' },
        { slug: 'Bad Slug', collection: 'scrolls', title: 'X', tier: 1, status: 'maybe' },
      ],
      [publishedText()],
    );
    const errors = result.errors.map((finding) => finding.message);
    expect(errors).toContainEqual(expect.stringContaining('listed twice'));
    expect(errors).toContainEqual(expect.stringContaining('invalid slug'));
    expect(errors).toContainEqual(expect.stringContaining('collection must be one of'));
    expect(errors).toContainEqual(expect.stringContaining('status must be'));
    expect(result.warnings.map((finding) => finding.message)).toContainEqual(
      expect.stringContaining('already published'),
    );
  });
});
