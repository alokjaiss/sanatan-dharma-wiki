/**
 * Keeps the GFM footnotes section out of the search index: citations match searches for
 * almost everything and crowd out the passages readers are looking for.
 */
import type { Element, Root } from 'hast';
import { visit } from 'unist-util-visit';

export function rehypeFootnotesIgnore() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'section' && node.properties?.dataFootnotes !== undefined) {
        node.properties.dataPagefindIgnore = '';
      }
    });
  };
}
