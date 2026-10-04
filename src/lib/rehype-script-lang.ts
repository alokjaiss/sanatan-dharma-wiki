/**
 * Wraps runs of Indic-script text in <span lang="…" class="indic"> so screen readers switch
 * voice and CSS can set the script's font and optical size (MASTER_PROMPT.md §3, rule 5).
 */
import type { Element, ElementContent, Root, Text } from 'hast';
import { SKIP, visit } from 'unist-util-visit';

const SCRIPTS: [RegExp, string][] = [
  [/\p{Script_Extensions=Devanagari}/u, 'sa-Deva'],
  [/\p{Script_Extensions=Tamil}/u, 'ta'],
  [/\p{Script_Extensions=Telugu}/u, 'te'],
  [/\p{Script_Extensions=Kannada}/u, 'kn'],
  [/\p{Script_Extensions=Malayalam}/u, 'ml'],
  [/\p{Script_Extensions=Bengali}/u, 'bn'],
  [/\p{Script_Extensions=Gujarati}/u, 'gu'],
  [/\p{Script_Extensions=Gurmukhi}/u, 'pa'],
  [/\p{Script_Extensions=Oriya}/u, 'or'],
];

const LETTERS =
  '\\p{Script=Devanagari}\\p{Script=Tamil}\\p{Script=Telugu}\\p{Script=Kannada}\\p{Script=Malayalam}\\p{Script=Bengali}\\p{Script=Gujarati}\\p{Script=Gurmukhi}\\p{Script=Oriya}';
const PUNCTUATION = '।॥';
/** An Indic run: letters, optionally joined by spaces, dandas, digits and light punctuation. */
const RUN = new RegExp(`[${LETTERS}${PUNCTUATION}]+(?:[\\s\\d.,;:'’()-]*[${LETTERS}${PUNCTUATION}]+)*`, 'gu');

const SKIP_TAGS = new Set(['code', 'pre', 'script', 'style', 'svg', 'math']);

function langOf(text: string): string {
  for (const [pattern, lang] of SCRIPTS) if (pattern.test(text)) return lang;
  return 'sa-Deva';
}

export function rehypeScriptLang() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || parent.type !== 'element') return;
      const element = parent as Element;
      if (SKIP_TAGS.has(element.tagName) || element.properties?.lang) return;

      const matches = Array.from(node.value.matchAll(RUN));
      if (matches.length === 0) return;

      const children: ElementContent[] = [];
      let cursor = 0;
      for (const match of matches) {
        if (match.index > cursor) children.push({ type: 'text', value: node.value.slice(cursor, match.index) });
        children.push({
          type: 'element',
          tagName: 'span',
          properties: { lang: langOf(match[0]), className: ['indic'] },
          children: [{ type: 'text', value: match[0] }],
        });
        cursor = match.index + match[0].length;
      }
      if (cursor < node.value.length) children.push({ type: 'text', value: node.value.slice(cursor) });

      element.children.splice(index, 1, ...children);
      return [SKIP, index + children.length];
    });
  };
}
