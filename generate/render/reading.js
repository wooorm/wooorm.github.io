/**
 * @import {Element} from 'hast'
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
          return h('li.card-wrap', [
            h('.card', [
              h('.caption', [
                h('h3', h('span.text', title)),
                h('p', h('span.text', author)),
                typeof review === 'number'
                  ? h('p', h('span.text', rating(review)))
                  : undefined
              ])
            ])
          ])
        })
    )
  ]
}

/**
 * @param {number} value
 * @returns {Element}
 */
export function rating(value) {
  assert(typeof value === 'number')
  const floored = Math.floor(value)
  const rest = value - floored

  return h(
    'span',
    {title: value + ' out of 5'},
    '★'.repeat(floored) + (rest >= 0.5 ? '½' : '')
  )
}
