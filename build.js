'use strict'

var path = require('path')
var mkdirp = require('mkdirp')
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var h = require('hastscript')
var select = require('hast-util-select').select
var unified = require('unified')
var markdown = require('remark-parse')
var style = require('remark-preset-wooorm')
var links = require('remark-validate-links')
var remark2rehype = require('remark-rehype')
var doc = require('rehype-document')
var slug = require('rehype-slug')
var min = require('rehype-preset-minify')
var favicon = require('rehype-prevent-favicon-request')
var html = require('rehype-stringify')
var pack = require('./package.json')

var pipeline = unified()
  .use(markdown)
  .use(style)
  .use(links, false)
  .use(remark2rehype)
  .use(doc, {
    title: pack.name,
    css: '/index.css',
    js: '/index.js'
  })
  .use(slug)
  .use(nojs)
  .use(avatar)
  .use(min)
  .use(favicon)
  .use(html)
  .use(move)

var files = ['readme.md', 'thanks/readme.md']

files.forEach(d => {
  pipeline.process(vfile.readSync(d), function(err, file) {
    console.error(report(err || file))

    if (file) {
      mkdirp.sync(file.dirname)
      vfile.writeSync(file)
    }
  })
})

function nojs() {
  var script = `
    document.body.className = 'js';
    document.body.removeChild(document.currentScript)
  `

  return transform

  function transform(tree) {
    var body = select('body', tree)
    var props = body.properties

    if (!('className' in props)) {
      props.className = []
    }

    props.className.push('nojs')

    body.children.unshift({
      type: 'element',
      tagName: 'script',
      properties: {},
      children: [{type: 'text', value: script}]
    })
  }
}

function avatar() {
  return transform
  function transform(tree, file) {
    if (file.dirname !== '.') return
    select('body', tree).children.unshift(
      h('figure', [h('img', {src: './pinguin.png'})])
    )
  }
}

function move() {
  return transform
  function transform(_, file) {
    file.dirname = path.join('static', file.dirname)
    file.extname = '.html'

    if (file.stem === 'readme') {
      file.stem = 'index'
    }
  }
}
