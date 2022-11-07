/**
 * @typedef {import('vfile').VFile} VFile
 */

import {matter} from 'vfile-matter'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import {h} from 'hastscript'

const articlePipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkRehype, {allowDangerousHtml: true})
  .use(rehypeRaw)
  .use(rehypeHighlight, {ignoreMissing: true})
  .use(rehypeSlug)

/**
 *
 * @param {VFile} file
 * @returns
 */
export default function post(file) {
  const slug = file.stem

  matter(file)

  const {tags} = file.data.matter || {}

  return {
    data: Object.assign({}, file.data.matter, {
      type: 'article',
      tags: tags || [],
      pathname: ['', 'blog', slug, ''].join('/')
    }),
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
