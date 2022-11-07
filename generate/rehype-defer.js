/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 */

import {visit} from 'unist-util-visit'

/**
 * Plugin to defer scripts.
 *
 * @type {import('unified').Plugin<[], Root>}
 */
export default function defer() {
  return function (tree) {
    /** @type {Array<ElementContent>} */
    const scripts = []
    /** @type {Element|null} */
    let head = null

    visit(tree, 'element', function (node, index, parent) {
      if (
        node.tagName === 'script' &&
        node.properties &&
        parent &&
        typeof index === 'number'
      ) {
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
    scope.children = scope.children.concat(scripts)
  }
}
