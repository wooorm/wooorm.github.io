/**
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef {import('./index.js').Page} Page
 */

import {h} from 'hastscript'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'
import {matter} from 'vfile-matter'

const articlePipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkRehype, {allowDangerousHtml: true})
  .use(rehypeRaw)
  .use(rehypeHighlight)
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

  function render() {
    const tree = articlePipeline.runSync(articlePipeline.parse(file), file)
    return h(
      '.content',
      h('.article-wrap', h('.article', h('.article-inner', tree.children)))
    )
  }
}
