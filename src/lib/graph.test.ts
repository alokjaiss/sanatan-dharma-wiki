import { describe, expect, it } from 'vitest';
import { ancestors, buildGraph, guruChain, refId, siblings, type GraphEntry } from './graph';

const entries: GraphEntry[] = [
  { collection: 'texts', id: 'mahabharata', data: { title: 'Mahabharata' } },
  {
    collection: 'texts',
    id: 'bhagavad-gita',
    data: {
      title: 'Bhagavad Gita',
      partOf: 'mahabharata',
      order: 2,
      authorship: [{ person: 'vyasa', role: 'author', basis: 'traditional' }],
      deities: ['krishna'],
      concepts: ['dharma'],
    },
  },
  { collection: 'texts', id: 'anugita', data: { title: 'Anugita', partOf: 'mahabharata', order: 3 } },
  { collection: 'texts', id: 'sanatsujatiya', data: { title: 'Sanatsujatiya', partOf: 'mahabharata', order: 1 } },
  { collection: 'texts', id: 'brahma-sutra', data: { title: 'Brahma Sutras' } },
  {
    collection: 'texts',
    id: 'brahma-sutra-bhashya-shankara',
    data: {
      title: 'Brahma Sutra Bhashya',
      // Astro hands references over as { collection, id }.
      commentsOn: { collection: 'texts', id: 'brahma-sutra' },
      authorship: [{ person: { collection: 'people', id: 'shankara' }, role: 'commentator', basis: 'scholarly' }],
    },
  },
  { collection: 'people', id: 'vyasa', data: { title: 'Vyasa' } },
  { collection: 'people', id: 'gaudapada', data: { title: 'Gaudapada' } },
  {
    collection: 'people',
    id: 'govinda',
    data: { title: 'Govinda Bhagavatpada', gurus: [{ person: 'gaudapada', kind: 'diksha' }] },
  },
  {
    collection: 'people',
    id: 'shankara',
    data: {
      title: 'Adi Shankaracharya',
      gurus: [{ person: 'govinda', kind: 'diksha' }],
      traditions: ['advaita'],
      birthplace: 'kaladi',
    },
  },
  {
    collection: 'people',
    id: 'padmapada',
    data: { title: 'Padmapada', gurus: [{ person: 'shankara', kind: 'diksha' }], traditions: ['advaita'] },
  },
  {
    collection: 'traditions',
    id: 'vedanta',
    data: { title: 'Vedanta', coreTexts: ['brahma-sutra', 'bhagavad-gita'] },
  },
  {
    collection: 'traditions',
    id: 'advaita',
    data: { title: 'Advaita Vedanta', parent: 'vedanta', founders: ['shankara'], deityFocus: [] },
  },
  {
    collection: 'concepts',
    id: 'brahman',
    data: {
      title: 'Brahman',
      related: ['atman'],
      interpretations: [{ tradition: 'advaita', summary: 'The sole reality.' }],
    },
  },
  { collection: 'concepts', id: 'atman', data: { title: 'Atman' } },
  { collection: 'concepts', id: 'dharma', data: { title: 'Dharma' } },
  {
    collection: 'places',
    id: 'sringeri',
    data: { title: 'Sringeri', traditions: ['advaita'], people: ['shankara'] },
  },
  { collection: 'places', id: 'kaladi', data: { title: 'Kaladi' } },
  { collection: 'deities', id: 'krishna', data: { title: 'Krishna' } },
  { collection: 'deities', id: 'vishnu', data: { title: 'Vishnu', related: ['krishna'] } },
];

const graph = buildGraph(entries);

describe('buildGraph', () => {
  it('lists contents in reading order', () => {
    expect(graph.contents.get('mahabharata')).toEqual(['sanatsujatiya', 'bhagavad-gita', 'anugita']);
  });

  it('computes commentaries and works from either reference shape', () => {
    expect(graph.commentaries.get('brahma-sutra')).toEqual(['brahma-sutra-bhashya-shankara']);
    expect(graph.works.get('shankara')).toEqual([
      { text: 'brahma-sutra-bhashya-shankara', role: 'commentator', basis: 'scholarly', note: undefined },
    ]);
    expect(graph.works.get('vyasa')?.map((work) => work.text)).toEqual(['bhagavad-gita']);
  });

  it('computes disciples, figures, founders and birthplaces', () => {
    expect(graph.disciples.get('shankara')).toEqual([{ person: 'padmapada', kind: 'diksha', note: undefined }]);
    expect(graph.figures.get('advaita')).toEqual(['shankara', 'padmapada']);
    expect(graph.founded.get('shankara')).toEqual(['advaita']);
    expect(graph.bornHere.get('kaladi')).toEqual(['shankara']);
  });

  it('computes tradition views', () => {
    expect(graph.authoritativeIn.get('bhagavad-gita')).toEqual(['vedanta']);
    expect(graph.subTraditions.get('vedanta')).toEqual(['advaita']);
    expect(graph.centres.get('advaita')).toEqual(['sringeri']);
    expect(graph.placesOfPerson.get('shankara')).toEqual(['sringeri']);
    expect(graph.keyDoctrines.get('advaita')).toEqual([{ concept: 'brahman', summary: 'The sole reality.' }]);
  });

  it('computes concept and deity views, symmetric where relations are symmetric', () => {
    expect(graph.discussedIn.get('dharma')).toEqual(['bhagavad-gita']);
    expect(graph.relatedConcepts.get('atman')).toEqual(['brahman']);
    expect(graph.relatedConcepts.get('brahman')).toEqual(['atman']);
    expect(graph.relatedDeities.get('krishna')).toEqual(['vishnu']);
    expect(graph.textsOfDeity.get('krishna')).toEqual(['bhagavad-gita']);
  });
});

describe('chains', () => {
  it('follows the guru line back to the earliest known teacher', () => {
    expect(guruChain(graph, 'padmapada')).toEqual(['gaudapada', 'govinda', 'shankara', 'padmapada']);
  });

  it('stops at cycles', () => {
    const cyclic = buildGraph([
      { collection: 'people', id: 'a', data: { title: 'A', gurus: [{ person: 'b', kind: 'diksha' }] } },
      { collection: 'people', id: 'b', data: { title: 'B', gurus: [{ person: 'a', kind: 'diksha' }] } },
    ]);
    expect(guruChain(cyclic, 'a')).toEqual(['b', 'a']);
  });

  it('builds breadcrumbs and siblings', () => {
    expect(ancestors(graph, 'bhagavad-gita')).toEqual(['mahabharata']);
    expect(ancestors(graph, 'advaita')).toEqual(['vedanta']);
    expect(siblings(graph, 'bhagavad-gita')).toEqual({ previous: 'sanatsujatiya', next: 'anugita' });
  });

  it('reads both reference shapes', () => {
    expect(refId('vyasa')).toBe('vyasa');
    expect(refId({ collection: 'people', id: 'vyasa' })).toBe('vyasa');
    expect(refId(undefined)).toBeUndefined();
  });
});
