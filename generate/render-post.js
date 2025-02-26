/**
 * @import {VFile} from 'vfile'
 * @import {Page} from './index.js'
 */

import {h} from 'hastscript'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeStarryNight from 'rehype-starry-night'
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
