import {matter} from 'vfile-matter'
import unified from 'unified'
import parse from 'remark-parse'
import frontmatter from 'remark-frontmatter'
import remark2rehype from 'remark-rehype'
import raw from 'rehype-raw'
import slug from 'rehype-slug'
import highlight from 'rehype-highlight'
import {h} from 'hastscript'

const articlePipeline = unified()
  .use(parse, {commonmark: true})
  .use(frontmatter)
  .use(remark2rehype, {allowDangerousHtml: true})
  .use(raw)
  .use(highlight, {subset: false, ignoreMissing: true})
  .use(slug)

export default function post(file) {
  const slug = file.stem

  matter(file)

  const {tags} = file.data.matter

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
    return h('.article.content', h('.article-inner', tree.children))
  }
}
