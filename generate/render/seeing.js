/**
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 *
 * @typedef Photo
 * @property {string} name
 * @property {string} title
 * @property {Date} date
 */

import fs from 'node:fs/promises'
import {parse} from 'yaml'
import {h} from 'hastscript'

const url = new URL('../../asset/image/index.yml', import.meta.url)
const photos = /** @type {Array<Photo>} */ (
  parse(String(await fs.readFile(url)))
)

photos.sort(sort)

/** @type {MetadataRaw} */
export const data = {
  title: 'Photos',
  label: 'photos',
  description: 'Things Titus sees',
  published: '2020-05-01T00:00:00.000Z',
  modified: photos[photos.length - 1].date
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Seeing')),
    h(
      'ol.pictures',
      photos.map((d) =>
        h('li.picture-root', [
          h('.picture-wrap', [
            h('.picture', [
              h('img', {src: '/image/' + d.name, alt: ''}),
              h('h2.caption', h('span.text', d.title))
            ])
          ])
        ])
      )
    )
  ]
}

/**
 * @param {Photo} a
 * @param {Photo} b
 */
function sort(a, b) {
  return pick(b).valueOf() - pick(a).valueOf()
}

/**
 * @param {Photo} d
 */
function pick(d) {
  return d.date
}
