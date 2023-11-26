/// <reference types="./types.js" />

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Root} Root
 *
 * @typedef {import('vfile').DataMap} DataMap
 */

/**
 * @typedef {DataMap['meta']} Metadata
 *   Metadata.
 *
 * @typedef Page
 *   Page.
 * @property {Metadata} data
 *   Data.
 * @property {Render} render
 *   Render.
 *
 * @callback Render
 *   Render a page.
 * @param {ReadonlyArray<Readonly<Page>>} pages
 *   All pages.
 * @returns {Promise<Array<ElementContent> | Element> | Array<ElementContent> | Element}
 *   Content.
 *
 * @callback Task
 *   Task.
 * @returns {Promise<undefined>}
 *   Promise.
 */

import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {glob} from 'glob'
import {h} from 'hastscript'
import all from 'p-all'
import rehypeDocument from 'rehype-document'
import rehypeInferReadingTimeMeta from 'rehype-infer-reading-time-meta'
import rehypeMeta from 'rehype-meta'
import rehypePresetMinify from 'rehype-preset-minify'
import rehypePreventFaviconRequest from 'rehype-prevent-favicon-request'
import rehypeStringify from 'rehype-stringify'
import {read, write} from 'to-vfile'
import {unified} from 'unified'
import {u} from 'unist-builder'
import {VFile} from 'vfile'
import {reporter} from 'vfile-reporter'
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
import {generateOgImage} from './screenshot.jsx'
import unifiedMkdirp from './unified-mkdirp.js'
import wooormMove from './wooorm-move.js'

/** @type {Array<Page>} */
const pages = [home, writing, activity, seeing, watching, listening, thanks]

let index = -1

while (++index < pages.length) {
  const page = pages[index]
  if (!page.data.pathname) {
    page.data.pathname = '/' + page.data.label + '/'
  }
}

const posts = await glob('post/**/*.md')
index = -1

while (++index < posts.length) {
  pages.push(renderPost(await read(posts[index])))
}

const pipeline = unified()
  .use(rehypePictures, {base: 'build'})
  .use(rehypeWrap)
  .use(rehypeDocument, {
    link: [
      {href: '/syntax.css', rel: 'stylesheet'},
      {href: '/index.css', rel: 'stylesheet'},
      {href: '/big.css', media: '(min-width: 32em)', rel: 'stylesheet'}
    ],
    script: [
      "if('paintWorklet' in CSS)CSS.paintWorklet.addModule('https://www.unpkg.com/css-houdini-squircle@0.1.5/squircle.min.js')"
    ]
  })
  .use(rehypeInferReadingTimeMeta)
  .use(rehypeMeta, {
    author: 'Titus Wormer',
    authorTwitter: '@wooorm',
    color: '#000000',
    copyright: true,
    name: 'wooorm.com',
    og: true,
    origin: 'https://wooorm.com',
    separator: ' | ',
    siteAuthor: 'Titus Wormer',
    siteTags: ['oss', 'open', 'source', 'ties', 'music', 'shows'],
    siteTwitter: '@wooorm',
    type: 'website',
    twitter: true
  })
  .use(rehypeDefer)
  .use(rehypePreventFaviconRequest)
  .use(rehypePresetMinify)
  .use(wooormMove)
  .use(unifiedMkdirp)
  .use(rehypeStringify)
  .freeze()

/** @type {Array<Task>} */
const tasks = []
index = -1

while (++index < pages.length) {
  const page = pages[index]

  tasks.push(async function () {
    // Generate OG image.
    page.data.image = {
      height: 1256,
      url: 'https://wooorm.com' + page.data.pathname + 'index.png',
      width: 2400
    }
    const file = new VFile()
    file.data.meta = {...file.data.meta, ...page.data}

    const result = await page.render(pages)
    /** @type {Root} */
    // @ts-expect-error: non-roots are actually fine for `run`.
    const inputTree = Array.isArray(result) ? u('root', result) : result

    const tree = await pipeline.run(inputTree, file)
    file.value = pipeline.stringify(tree, file)

    const imgPath = file.path.replace(/\.html$/, '.png')
    const buf = await generateOgImage(page.data)
    await fs.writeFile(imgPath, buf)

    await write(file)

    console.error(reporter(file))
  })
}

all(tasks, {concurrency: 2})

function rehypeWrap() {
  const structure = pages
    .map(function (d) {
      return d.data
    })
    .filter(function (d) {
      assert(d.pathname)
      const parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts.length === 1
    })

  /**
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File
   * @returns {Root}
   *   New tree.
   */
  return function (tree, file) {
    assert(file.data.meta?.pathname, 'expected `pathname` on `meta`')
    const self = section(file.data.meta.pathname)

    return u('root', [
      h('header', [
        h('nav.top', [
          h(
            'ol',
            structure.map(function (d) {
              assert(d.pathname)
              return h('li', {className: d.label ? [d.label] : []}, [
                h(
                  'span.text',
                  h(
                    'a',
                    {
                      className:
                        section(d.pathname) === self ? ['active'] : undefined,
                      href: d.pathname
                    },
                    d.title || ''
                  )
                )
              ])
            })
          )
        ])
      ]),
      h('main', tree),
      h('footer')
    ])
  }

  /**
   * @param {string} pathname
   *   Pathname.
   * @returns {string}
   *   Section.
   */
  function section(pathname) {
    return pathname.split('/')[1]
  }
}
