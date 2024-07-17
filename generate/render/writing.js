/**
 * @import {Metadata, Render} from '../index.js'
 */

import assert from 'node:assert/strict'
import {h} from 'hastscript'

const description =
  'A place for things that don’t fit neatly in readmes. Most things are in readmes.'
const title = 'Writing'

/** @type {Readonly<Metadata>} */
export const data = {
  description,
  label: 'blog',
  modified: '2022-06-29T00:00:00.000Z',
  published: '2020-05-01T00:00:00.000Z',
  title
}

/** @type {Render} */
export function render(pages) {
  const posts = pages
    .map(function (d) {
      return d.data
    })
    .filter(function (d) {
      assert(d.pathname)
      const parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts[0] === 'blog' && parts.length === 2
    })

  const items = posts.sort(sort).map(function (d) {
    let published = fmt(d.published)
    const modified = fmt(d.modified)

    if (modified === published) published = undefined

    return h('li.card-wrap', [
      h('.card', [
        h('.caption', [
          h('h3', h('span.text', h('a', {href: d.pathname}, d.title))),
          h('p', h('span.text', d.description)),
          published || modified
            ? h(
                'p',
                modified ? h('span.text', modified) : '',
                published && modified ? h('span.text', ' · ') : '',
                published
                  ? h('span.text', (modified ? 'original: ' : '') + published)
                  : ''
              )
            : ''
        ])
      ])
    ])
  })

  return [
    h('h1', h('span.text', title)),
    h('p', h('span.text', description)),
    h('ol.cards', items)
  ]
}

/**
 * @param {Readonly<Metadata>} a
 *   Left.
 * @param {Readonly<Metadata>} b
 *   Right.
 * @returns {number}
 *   Sort value.
 */
function sort(a, b) {
  return pick(b).valueOf() - pick(a).valueOf()
}

/**
 * @param {Readonly<Metadata>} d
 *   Data.
 * @returns {Date}
 *   Date.
 */
function pick(d) {
  const value = d.published?.valueOf()
  return value === undefined ? new Date() : new Date(value)
}

/**
 * @param {Readonly<Date> | string | null | undefined} value
 *   Value.
 * @returns {string | undefined}
 *   Formatted value.
 */
function fmt(value) {
  return value
    ? new Date(value).toLocaleDateString('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : undefined
}
