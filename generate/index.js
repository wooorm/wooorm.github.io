/**
 * @import {ElementContent, Element, Root} from 'hast'
 * @import {DataMap} from 'vfile'
 * @import {} from './types.js'
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
 * @returns {Promise<VFile>}
 *   Promise.
 */

import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {glob} from 'glob'
import {h} from 'hastscript'
import {fromHtml} from 'hast-util-from-html'
import {select} from 'hast-util-select'
import {toHtml} from 'hast-util-to-html'
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
import {rss} from 'xast-util-feed'
import {toXml} from 'xast-util-to-xml'
import rehypeDefer from './rehype-defer.js'
import rehypePictures from './rehype-pictures.js'
import renderPost from './render-post.js'
import * as home from './render/home.js'
import * as thanks from './render/thanks.js'
import * as writing from './render/writing.js'
import * as reading from './render/reading.js'
import * as seeing from './render/seeing.js'
import * as watching from './render/watching.js'
import * as listening from './render/listening.js'
import * as activity from './render/activity.js'
import {generateOgImage} from './screenshot.jsx'
import unifiedMkdirp from './unified-mkdirp.js'
import wooormMove from './wooorm-move.js'

const siteAuthor = 'Titus Wormer'
const siteLanguage = 'en'
const siteName = 'wooorm.com'
const siteTags = ['oss', 'open', 'source', 'ties', 'music', 'shows']
const siteOrigin = 'https://wooorm.com'

/** @type {Array<Page>} */
const pages = [
  home,
  writing,
  activity,
  seeing,
  reading,
  watching,
  listening,
  thanks
]

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
    language: siteLanguage,
    link: [
      {href: '/index.css', rel: 'stylesheet'},
      {href: '/big.css', media: '(min-width: 32em)', rel: 'stylesheet'},
      {href: '/syntax.css', rel: 'stylesheet'}
    ],
    script: [
      "if('paintWorklet' in CSS)CSS.paintWorklet.addModule('https://www.unpkg.com/css-houdini-squircle@0.1.5/squircle.min.js')"
    ]
  })
  .use(rehypeInferReadingTimeMeta)
  .use(rehypeMeta, {
    author: siteAuthor,
    color: '#000000',
    copyright: true,
    name: siteName,
    og: true,
    origin: siteOrigin,
    separator: ' | ',
    siteAuthor,
    siteTags,
    type: 'website'
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

    return file
  })
}

const files = await all(tasks, {concurrency: 2})

const now = new Date()

await fs.writeFile(
  new URL('../build/rss.xml', import.meta.url),
  toXml(
    rss(
      {
        author: siteAuthor,
        description: 'website',
        feedUrl: new URL('rss.xml', siteOrigin).href,
        lang: siteLanguage,
        tags: siteTags,
        title: siteName,
        url: siteOrigin
      },
      files
        // All blog entries that are published in the past.
        .filter(function (d) {
          assert(d.data.meta)
          return (
            d.data.meta.pathname &&
            d.data.meta.pathname.startsWith('/blog/') &&
            d.data.meta.pathname !== '/blog/' &&
            d.data.meta.published !== null &&
            d.data.meta.published !== undefined &&
            new Date(d.data.meta.published) < now
          )
        })
        // Sort.
        .sort(function (a, b) {
          assert(a.data.meta)
          assert(b.data.meta)
          assert(a.data.meta.published)
          assert(b.data.meta.published)
          return (
            new Date(b.data.meta.published).valueOf() -
            new Date(a.data.meta.published).valueOf()
          )
        })
        // Ten most recently published articles.
        .slice(0, 10)
        .map(function (file) {
          const meta = file.data.meta
          assert(meta)
          assert(meta.author)
          assert(typeof meta.modified === 'string')
          assert(meta.pathname)
          assert(typeof meta.published === 'string')
          assert(meta.tags)
          assert(meta.title)

          const root = fromHtml(file.value)
          const content = select('.article-inner', root)
          assert(content)

          return {
            author: meta.author,
            descriptionHtml: toHtml(content),
            modified: meta.modified,
            published: meta.published,
            tags: meta.tags,
            title: meta.title,
            url: new URL(meta.pathname, siteOrigin).href
          }
        })
    )
  ) + '\n'
)

console.log('✔ `/rss.xml`')

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
