/**
 * @import {Grammar} from '@wooorm/starry-night'
 * @import {ElementContent, Root} from 'hast'
 * @import {VFile} from 'vfile'
 * @import {Page} from './index.js'
 */

/**
 * @typedef Options
 *   Configuration (optional)
 * @property {Array<Grammar> | null | undefined} [grammars]
 *   Grammars to support (default: `common`).
 */

import {common, createStarryNight} from '@wooorm/starry-night'
import {toString} from 'hast-util-to-string'
import {h} from 'hastscript'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'
import {visit} from 'unist-util-visit'
import {matter} from 'vfile-matter'

const articlePipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkRehype, {allowDangerousHtml: true})
  .use(rehypeRaw)
  .use(rehypeStarryNight)
  .use(rehypeSlug)

/**
 * @param {VFile} file
 *   File.
 * @returns {Page}
 *   Page.
 */
export default function post(file) {
  const slug = file.stem

  matter(file)

  const {tags} = file.data.matter || {}

  return {
    data: {
      ...file.data.matter,
      pathname: ['', 'blog', slug, ''].join('/'),
      tags: tags || [],
      type: 'article'
    },
    render
  }

  async function render() {
    const inputTree = articlePipeline.parse(file)
    const tree = await articlePipeline.run(inputTree, file)
    return h(
      '.content',
      h('.article-wrap', h('.article', h('.article-inner', tree.children)))
    )
  }
}

/**
 * Highlight code with `starry-night`.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
function rehypeStarryNight(options) {
  const settings = options || {}
  const grammars = settings.grammars || common
  const starryNightPromise = createStarryNight(grammars)
  const prefix = 'language-'

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {Promise<undefined>}
   *   Nothing.
   */
  return async function (tree) {
    const starryNight = await starryNightPromise

    visit(tree, 'element', function (node, index, parent) {
      if (!parent || index === undefined || node.tagName !== 'pre') {
        return
      }

      const head = node.children[0]

      if (!head || head.type !== 'element' || head.tagName !== 'code') {
        return
      }

      const classes = head.properties.className

      if (!Array.isArray(classes)) return

      const language = classes.find(function (d) {
        return typeof d === 'string' && d.startsWith(prefix)
      })

      if (typeof language !== 'string') return

      const scope = starryNight.flagToScope(language.slice(prefix.length))

      // Maybe warn?
      if (!scope) return

      const fragment = starryNight.highlight(toString(head), scope)
      const children = /** @type {Array<ElementContent>} */ (fragment.children)

      parent.children.splice(index, 1, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: [
            'highlight',
            'highlight-' + scope.replace(/^source\./, '').replace(/\./g, '-')
          ]
        },
        children: [{type: 'element', tagName: 'pre', properties: {}, children}]
      })
    })
  }
}
