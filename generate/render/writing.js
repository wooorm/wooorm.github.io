/**
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 * @typedef {import('../index.js').Metadata} Metadata
 */

import {h} from 'hastscript'

const title = 'Writing'
const description =
  'A place for things that don’t fit neatly in readmes. Most things are in readmes.'

/** @type {MetadataRaw} */
export const data = {
  title,
  label: 'blog',
  description,
  published: '2020-05-01T00:00:00.000Z',
  modified: '2022-06-29T00:00:00.000Z'
}

/** @type {Render} */
export function render(pages) {
  const posts = pages
    .map((d) => d.data)
    .filter((d) => {
      const parts = d.pathname.replace(/^\/|\/$/g, '').split('/')
      return parts[0] === 'blog' && parts.length === 2
    })

  const items = posts.sort(sort).map((d) => {
    let pub = fmt(d.published)
    const mod = fmt(d.modified)

    if (mod === pub) pub = ''

    return h('li.card-wrap', [
      h('.card', [
        h('.caption', [
          h('h3', h('span.text', h('a', {href: d.pathname}, d.title))),
          h('p', h('span.text', d.description)),
          pub || mod
            ? h(
                'p',
                mod ? h('span.text', mod) : '',
                pub && mod ? h('span.text', ' · ') : '',
                pub ? h('span.text', (mod ? 'original: ' : '') + pub) : ''
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

  /**
   * @param {Metadata} a
   * @param {Metadata} b
   */
  function sort(a, b) {
    return pick(b).valueOf() - pick(a).valueOf()
  }

  /**
   * @param {Metadata} d
   */
  function pick(d) {
    const value = d.published?.valueOf()
    return value === undefined ? new Date() : new Date(value)
  }

  /**
   * @param {Metadata['published']} value
   */
  function fmt(value) {
    return value
      ? new Date(value).toLocaleDateString('en', {
          month: 'short',
          year: 'numeric',
          day: 'numeric'
        })
      : ''
  }
}
