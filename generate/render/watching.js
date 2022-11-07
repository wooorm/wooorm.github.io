/**
 * @typedef {import('../../crawl/shows.js').Thing} Thing
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 */

import fs from 'node:fs/promises'
import {h} from 'hastscript'

/** @type {Array<Thing>} */
let shows = []

try {
  shows = JSON.parse(
    String(await fs.readFile(new URL('../../data/shows.json', import.meta.url)))
  )
} catch {}

/** @type {MetadataRaw} */
export const data = {
  title: 'Watching',
  label: 'watching',
  description: 'Things Titus watches',
  published: '2020-05-01T00:00:00.000Z',
  modified: new Date()
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Watching (recently)')),
    h(
      'ol.covers',
      shows
        .filter((d) => d.image)
        .slice(0, 50)
        .map((d) =>
          h('li.cover-wrap', [
            h('.cover', [
              // Already filtered on this: it exists.
              d.image
                ? h('img', {
                    src: d.image.url,
                    alt: '',
                    width: 300,
                    height: Math.floor(d.image.height / (d.image.width / 300))
                  })
                : undefined,
              h(
                'h2.caption',
                h('span.text', d.title),
                h('br'),
                h('span.text', '(' + d.year + ')')
              )
            ])
          ])
        )
    )
  ]
}
