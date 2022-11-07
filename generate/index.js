/**
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 *
 * @callback Render
 * @param {Array<Page>} pages
 * @returns {Element|Array<ElementContent>}
 *
 * @typedef {string} Label
 * @typedef {import('vfile').DataMap['meta'] & {label?: Label}} MetadataRaw
 *
 * @typedef {Omit<MetadataRaw, 'pathname'> & {pathname: string}} Metadata
 *
 * @typedef Page
 * @property {Metadata} data
 * @property {Render} render
 *
 * @typedef TaskResult
 * @property {Element|Root} tree
 * @property {VFile} file
 *
 * @callback Task
 * @returns {TaskResult}
 */

import assert from 'node:assert/strict'
import glob from 'glob'
import all from 'p-all'
import {toVFile} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import {unified} from 'unified'
import rehypePreventFaviconRequest from 'rehype-prevent-favicon-request'
import rehypePresetMinify from 'rehype-preset-minify'
import rehypeDocument from 'rehype-document'
import rehypeMeta from 'rehype-meta'
import rehypeStringify from 'rehype-stringify'
import {u} from 'unist-builder'
import {h} from 'hastscript'
import wooormMove from './wooorm-move.js'
import unifiedMkdirp from './unified-mkdirp.js'
import rehypeDefer from './rehype-defer.js'
import rehypePictures from './rehype-pictures.js'
import renderPost from './render-post.js'
import * as home from './render/home.js'
import * as thanks from './render/thanks.js'
import * as writing from './render/writing.js'
import * as seeing from './render/seeing.js'
import * as watching from './render/watching.js'
import * as listening from './render/listening.js'
import * as activity from './render/activity.js'

/** @type {Array<Task>} */
const tasks = []

/** @type {Array<{data: Metadata, render: Render}>} */
// @ts-expect-error: `pathname` is added in a second.
const pages = [home, thanks, writing, activity, seeing, watching, listening]

const posts = glob.sync('post/**/*.md')

let index = -1

while (++index < pages.length) {
  if (!pages[index].data.pathname) {
    pages[index].data.pathname = '/' + pages[index].data.label + '/'
  }
}

index = -1

while (++index < posts.length) {
  pages.push(renderPost(toVFile.readSync(posts[index])))
}

index = -1

while (++index < pages.length) {
  add(pages[index])
}

/**
 * @param {Page} d
 */
function add(d) {
  tasks.push(() => {
    const tree = d.render(pages)
    return {
      tree: Array.isArray(tree) ? u('root', tree) : tree,
      file: toVFile({data: {meta: d.data}})
    }
  })
}

const pipeline = unified()
  .use(rehypePictures, {base: 'build'})
  .use(rehypeWrap)
  .use(rehypeDocument, {
    link: [
      {rel: 'stylesheet', href: '/syntax.css'},
      {rel: 'stylesheet', href: '/index.css'},
      {rel: 'stylesheet', media: '(min-width: 32em)', href: '/big.css'}
    ],
    script: [
      "if('paintWorklet' in CSS)CSS.paintWorklet.addModule('https://www.unpkg.com/css-houdini-squircle@0.1.5/squircle.min.js')"
    ]
  })
  .use(rehypeMeta, {
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
  .use(rehypeDefer)
  .use(rehypePreventFaviconRequest)
  .use(rehypePresetMinify)
  .use(wooormMove)
  .use(unifiedMkdirp)
  .use(rehypeStringify)
  .freeze()

const promises = tasks.map((fn) => () => {
  return Promise.resolve(fn())
    .then(({tree, file}) =>
      // @ts-expect-error: element is fine.
      pipeline.run(tree, file).then((tree) => ({tree, file}))
    )
    .then(({tree, file}) => {
      file.value = pipeline.stringify(tree, file)
      return file
    })
    .then((file) => toVFile.write(file).then(() => file))
    .then(done, done)

  /**
   * @param {Error|VFile} x
   */
  function done(x) {
    console.error(reporter(x))
  }
})

all(promises, {concurrency: 2})

/** @type {import('unified').Plugin<[], Root>} */
function rehypeWrap() {
  const structure = pages
    .map((d) => d.data)
    .filter((d) => {
      const parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts.length === 1
    })

  return function (tree, file) {
    assert(file.data.meta?.pathname, 'expected `pathname` on `meta`')
    const self = section(file.data.meta.pathname)

    return u('root', [
      h('header', [
        h('nav.top', [
          h(
            'ol',
            structure.map((d) =>
              h('li', {className: d.label ? [d.label] : []}, [
                h(
                  'span.text',
                  h(
                    'a',
                    {
                      className:
                        section(d.pathname) === self ? ['active'] : null,
                      href: d.pathname
                    },
                    d.title || ''
                  )
                )
              ])
            )
          )
        ])
      ]),
      h('main', tree),
      h('footer')
    ])
  }

  /**
   * @param {string} pathname
   */
  function section(pathname) {
    return pathname.split('/')[1]
  }
}
