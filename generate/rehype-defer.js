/**
 * @import {ElementContent, Element, Root} from 'hast'
 */

import {visit} from 'unist-util-visit'

/**
 * Plugin to defer scripts.
 */
export default function defer() {
  /**
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    /** @type {Array<ElementContent>} */
    const scripts = []
    /** @type {Element | undefined} */
    let head

    visit(tree, 'element', function (node, index, parent) {
      if (node.tagName === 'script' && parent && typeof index === 'number') {
        if (
          !node.properties.type ||
          !/module/i.test(String(node.properties.type))
        ) {
          node.properties.defer = true
        }

        scripts.push(node)
        parent.children.splice(index, 1)

        return index
      }

      if (node.tagName === 'head') {
        head = node
      }
    })

    const scope = head || tree
    scope.children = [...scope.children, ...scripts]
  }
}
