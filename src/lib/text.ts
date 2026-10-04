/**
 * Text helpers for transliterated and native-script names: search variants, script detection
 * and Unicode hygiene.
 */

/** IAST / ISO 15919 letters folded to the common English spelling (ś → sh, ṛ → ri, …). */
const COMMON_SPELLING: Record<string, string> = {
  ā: 'a',
  ī: 'i',
  ū: 'u',
  ṛ: 'ri',
  ṝ: 'ri',
  ḷ: 'li',
  ḹ: 'li',
  ṃ: 'm',
  ṁ: 'm',
  ḥ: 'h',
  ṅ: 'n',
  ñ: 'n',
  ṭ: 't',
  ḍ: 'd',
  ṇ: 'n',
  ś: 'sh',
  ṣ: 'sh',
  ē: 'e',
  ō: 'o',
  ṟ: 'r',
  ṉ: 'n',
  ḻ: 'l',
  // IAST c is the "ch" of English spellings (Caitanya → Chaitanya); IAST ch becomes chh.
  c: 'ch',
};

const IAST_DIACRITIC = /[āīūṛṝḷḹṃṁḥṅñṭḍṇśṣēōṟṉḻ]/i;

/** Matches characters of the Indic scripts we support. */
export const INDIC_CHAR =
  /[\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Gurmukhi}\p{Script=Gujarati}\p{Script=Oriya}\p{Script=Tamil}\p{Script=Telugu}\p{Script=Kannada}\p{Script=Malayalam}]/u;

export function hasIastDiacritics(value: string): boolean {
  return IAST_DIACRITIC.test(value.normalize('NFC'));
}

export function isIndic(value: string): boolean {
  return INDIC_CHAR.test(value);
}

/** Lowercase and drop every diacritic: "Śaṅkarācārya" → "sankaracarya". */
export function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC').toLowerCase();
}

/** Lowercase IAST to its common English spelling: "Śaṅkarācārya" → "shankaracharya". */
export function toCommonSpelling(iast: string): string {
  return Array.from(iast.normalize('NFC').toLowerCase())
    .map((char) => COMMON_SPELLING[char] ?? char)
    .join('');
}

const ANUSVARA_CLUSTER = /([ङञणनम])्(?=[कखगघचछजझटठडढतथदधपफबभ])/g;

/**
 * Hindi spelling often writes a homorganic nasal as an anusvāra: शङ्कर → शंकर.
 * Returns the anusvāra spelling (or the input unchanged).
 */
export function anusvaraVariant(devanagari: string): string {
  return devanagari.replace(ANUSVARA_CLUSTER, 'ं');
}

/**
 * Every spelling a reader might type for an entry, for the search index: the title and
 * aliases as written, without diacritics, in common English spelling, and native-script
 * names with anusvāra spellings.
 */
export function searchVariants(names: {
  title: string;
  roman?: string;
  native?: string;
  aliases?: readonly string[];
}): string[] {
  const variants = new Set<string>();
  const add = (value: string | undefined) => {
    if (value) variants.add(value.normalize('NFC').trim());
  };
  const latin = [names.title, names.roman, ...(names.aliases ?? [])].filter(
    (value): value is string => Boolean(value) && !isIndic(value as string),
  );
  for (const name of latin) {
    add(name.toLowerCase());
    add(stripDiacritics(name));
    if (name === names.roman || hasIastDiacritics(name)) add(toCommonSpelling(name));
  }
  const native = [names.native, ...(names.aliases ?? [])].filter(
    (value): value is string => Boolean(value) && isIndic(value as string),
  );
  for (const name of native) {
    add(name);
    add(anusvaraVariant(name));
  }
  return [...variants];
}

/** True when the string is already in Unicode NFC (precomposed IAST, canonical Devanagari). */
export function isNfc(value: string): boolean {
  return value === value.normalize('NFC');
}

/** "rigveda" → "Rigveda", "shukla-yajurveda" → "Shukla yajurveda": for enum labels only. */
export function humanize(value: string): string {
  const spaced = value.replaceAll('-', ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
