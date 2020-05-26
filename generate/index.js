'use strict'

var path = require('path')
var glob = require('glob')
var all = require('p-all')
var vfile = require('to-vfile')
var report = require('vfile-reporter')
var unified = require('unified')
var favicon = require('rehype-prevent-favicon-request')
var minify = require('rehype-preset-minify')
var doc = require('rehype-document')
var meta = require('rehype-meta')
var stringify = require('rehype-stringify')
var u = require('unist-builder')
var h = require('hastscript')
var move = require('./wooorm-move')
var mkdirp = require('./unified-mkdirp')
var defer = require('./rehype-defer')
var pictures = require('./rehype-pictures')
var renderPost = require('./render-post')

var tasks = []

var pages = [
  require('./render/home'),
  require('./render/thanks'),
  require('./render/writing'),
  require('./render/seeing'),
  require('./render/watching'),
  require('./render/listening')
]

pages.forEach((d) => {
  if (!d.data.pathname) {
    d.data.pathname = '/' + d.data.label + '/'
  }
})

glob.sync('post/**/*.md').forEach((d) => {
  pages.push(renderPost(vfile.readSync(d)))
})

pages.forEach((d) => {
  tasks.push(() => {
    var tree = d.render(pages)
    return {
      tree: 'type' in tree ? tree : u('root', tree),
      file: vfile({data: {meta: d.data}})
    }
  })
})

var pipeline = unified()
  .use(pictures, {base: path.join('build')})
  .use(wrap)
  .use(doc, {
    link: [
      {rel: 'stylesheet', href: '/syntax.css'},
      {rel: 'stylesheet', href: '/index.css'},
      {rel: 'stylesheet', media: '(min-width: 32em)', href: '/big.css'}
    ]
  })
  .use(meta, {
    twitter: true,
    og: true,
    copyright: true,
    origin: 'https://wooorm.com',
    type: 'website',
    name: 'wooorm.com',
    siteTags: ['oss', 'open', 'source', 'ties', 'music', 'shows'],
    siteAuthor: 'Titus Wormer',
    siteTwitter: '@wooorm',
    author: 'Titus Wormer',
    authorTwitter: '@wooorm',
    separator: ' | ',
    color: '#000000'
  })
  .use(defer)
  .use(favicon)
  .use(minify)
  .use(move)
  .use(mkdirp)
  .use(stringify)
  .freeze()

var promises = tasks.map((fn) => () => {
  return Promise.resolve(fn())
    .then(({tree, file}) => {
      return pipeline.run(tree, file).then((tree) => ({tree, file}))
    })
    .then(({tree, file}) => {
      file.contents = pipeline.stringify(tree, file)
      return file
    })
    .then((file) => vfile.write(file).then(() => file))
    .then(done, done)

  function done(x) {
    console.log(report(x))
  }
})

all(promises, {concurrency: 2})

function wrap() {
  var structure = pages
    .map((d) => d.data)
    .filter((d) => {
      var parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts.length === 1
    })

  return transform

  function transform(tree, file) {
    var self = section(file.data.meta.pathname)

    return u('root', [
      h('header', [h('nav.top', [h('ol', structure.map(map))])]),
      h('main', tree),
      h('footer')
    ])

    function map(d) {
      var active = section(d.pathname) === self ? ['active'] : null

      return h('li', {className: [d.label]}, [
        h(
          'span.text',
          h('a', {className: active, href: d.pathname}, d.title || '')
        )
      ])
    }
  }

  function section(pathname) {
    return pathname.split('/')[1]
  }
}
