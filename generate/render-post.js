'use strict'

var matter = require('vfile-matter')
var unified = require('unified')
var parse = require('remark-parse')
var frontmatter = require('remark-frontmatter')
var remark2rehype = require('remark-rehype')
var raw = require('rehype-raw')
var slug = require('rehype-slug')
var highlight = require('rehype-highlight')
var h = require('hastscript')

var articlePipeline = unified()
  .use(parse, {commonmark: true})
  .use(frontmatter)
  .use(remark2rehype, {allowDangerousHtml: true})
  .use(raw)
  .use(highlight, {subset: false, ignoreMissing: true})
  .use(slug)

module.exports = post

function post(file) {
  var slug = file.stem

  matter(file)

  var {tags} = file.data.matter

  return {
    data: Object.assign({}, file.data.matter, {
      type: 'article',
      tags: tags || [],
      pathname: ['', 'blog', slug, ''].join('/')
    }),
    render: render
  }

  function render() {
    var tree = articlePipeline.runSync(articlePipeline.parse(file), file)
    return h('.article.content', h('.article-inner', tree.children))
  }
}
