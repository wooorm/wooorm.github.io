/**
 * @typedef {import('../index.js').Metadata} Metadata
 * @typedef {import('../index.js').Render} Render
 */

/**
 * @typedef Photo
 *   Photo.
 * @property {string} date
 *   Date.
 * @property {string} name
 *   Name.
 * @property {string} title
 *   Title.
 */

import fs from 'node:fs/promises'
import {h} from 'hastscript'
import {parse} from 'yaml'

const url = new URL('../../asset/image/index.yml', import.meta.url)
let photos = /** @type {ReadonlyArray<Readonly<Photo>>} */ (
  parse(String(await fs.readFile(url)))
)

photos = [...photos].sort(sort)

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'Things Titus sees',
  label: 'photos',
  modified: photos[photos.length - 1].date,
  published: '2020-05-01T00:00:00.000Z',
  title: 'Photos'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Seeing')),
    h(
      'ol.pictures',
      photos.map(function (d) {
        return h('li.picture-root', [
          h('.picture-wrap', [
            h('.picture', [
              h('img', {alt: '', src: '/image/' + d.name}),
              h('h2.caption', h('span.text', d.title))
            ])
          ])
        ])
      })
    )
  ]
}

/**
 * @param {Readonly<Photo>} a
 *   Left.
 * @param {Readonly<Photo>} b
 *   Right.
 * @returns {number}
 *   Sort order.
 */
function sort(a, b) {
  return pick(b).valueOf() - pick(a).valueOf()
}

/**
 * @param {Readonly<Photo>} d
 *   Photo.
 * @returns {Date}
 *   Date.
 */
function pick(d) {
  return new Date(d.date)
}
