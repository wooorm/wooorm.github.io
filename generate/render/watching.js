/**
 * @import {Movie} from '../../crawl/movies.js'
 * @import {Metadata, Render} from '../index.js'
 */

import fs from 'node:fs/promises'
import {h} from 'hastscript'
import {rating} from './reading.js'

/** @type {ReadonlyArray<Readonly<Movie>>} */
let movies = []

try {
  movies = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/movies.json', import.meta.url))
    )
  )
} catch {
  // Empty.
}

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'Things Titus watches',
  label: 'watching',
  modified: new Date(),
  published: '2020-05-01T00:00:00.000Z',
  title: 'Watching'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Watching (recently)')),
    h(
      'ol.covers',
      movies.slice(0, 50).map(function (d) {
        return h('li.cover-wrap', [
          h('.cover', [
            h('img', {
              alt: '',
              height: Math.floor(d.image.height / (d.image.width / 300)),
              src: d.image.url,
              width: 300
            }),
            h('.caption', [
              h('h2', [
                h('span.text', d.title),
                h('br'),
                h('span.text', '(' + d.year + ')')
              ]),
              h('p', h('span.text', rating(d.rating / 2)))
            ])
          ])
        ])
      })
    )
  ]
}
