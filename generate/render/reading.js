/**
 * @import {Book} from '../../crawl/books.js'
 * @import {Metadata, Render} from '../index.js'
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {h} from 'hastscript'

/** @type {ReadonlyArray<Readonly<Book>>} */
let books = []

try {
  books = JSON.parse(
    String(await fs.readFile(new URL('../../data/books.json', import.meta.url)))
  )
} catch {}

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'Things Titus reads',
  label: 'reading',
  modified: new Date(),
  published: '2024-04-01T00:00:00.000Z',
  title: 'Reading'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Reading (recently)')),
    h(
      'ol.cards',
      books
        .filter((d) => typeof d.review === 'number')
        .map(function (d) {
          const {author, title, review} = d
          assert(typeof review === 'number')
          const rounded = Math.min(5, Math.round(review))
          const remainder = 5 - rounded

          return h('li.card-wrap', [
            h('.card', [
              h('.caption', [
                h('h3', h('span.text', title)),
                h('p', h('span.text', author)),
                h(
                  'p',
                  h(
                    'span.text',
                    {title: review + ' out of 5'},
                    '★'.repeat(rounded) + '☆'.repeat(remainder)
                  )
                )
              ])
            ])
          ])
        })
    )
  ]
}
