import { describe, expect, it } from 'vitest';
import {
  anusvaraVariant,
  hasIastDiacritics,
  isIndic,
  isNfc,
  searchVariants,
  stripDiacritics,
  toCommonSpelling,
} from './text';

describe('toCommonSpelling', () => {
  it('folds IAST to the usual English spelling', () => {
    expect(toCommonSpelling('Śaṅkarācārya')).toBe('shankaracharya');
    expect(toCommonSpelling('Ṛgveda')).toBe('rigveda');
    expect(toCommonSpelling('Caitanya')).toBe('chaitanya');
    expect(toCommonSpelling('Bṛhadāraṇyaka')).toBe('brihadaranyaka');
  });
});

describe('stripDiacritics', () => {
  it('drops every diacritic and lowercases', () => {
    expect(stripDiacritics('Ādi Śaṅkarācārya')).toBe('adi sankaracarya');
  });
});

describe('anusvaraVariant', () => {
  it('writes homorganic nasals as anusvāra', () => {
    expect(anusvaraVariant('शङ्कर')).toBe('शंकर');
    expect(anusvaraVariant('वेदान्त')).toBe('वेदांत');
    expect(anusvaraVariant('धर्म')).toBe('धर्म');
  });
});

describe('searchVariants', () => {
  it('covers ASCII, IAST and native spellings', () => {
    const variants = searchVariants({
      title: 'Adi Shankaracharya',
      roman: 'Ādi Śaṅkarācārya',
      native: 'आदि शङ्कराचार्य',
      aliases: ['Śaṅkara'],
    });
    expect(variants).toEqual(
      expect.arrayContaining([
        'adi shankaracharya',
        'adi sankaracarya',
        'shankara',
        'sankara',
        'आदि शङ्कराचार्य',
        'आदि शंकराचार्य',
      ]),
    );
  });
});

describe('script helpers', () => {
  it('detects Indic script and IAST diacritics', () => {
    expect(isIndic('धर्म')).toBe(true);
    expect(isIndic('திருமுறை')).toBe(true);
    expect(isIndic('dharma')).toBe(false);
    expect(hasIastDiacritics('mokṣa')).toBe(true);
    expect(hasIastDiacritics('moksha')).toBe(false);
  });

  it('spots text that is not NFC', () => {
    expect(isNfc('Śaṅkara')).toBe(true);
    expect(isNfc('Śaṅkara'.normalize('NFD'))).toBe(false);
  });
});
