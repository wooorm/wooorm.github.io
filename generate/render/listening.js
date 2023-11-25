/**
 * @typedef {import('../../crawl/albums.js').Album} Album
 *
 * @typedef {import('../../crawl/artists.js').Artist} Artist
 *
 * @typedef {import('../index.js').Metadata} Metadata
 * @typedef {import('../index.js').Render} Render
 */

import fs from 'node:fs/promises'
import escape from 'escape-string-regexp'
import {h} from 'hastscript'
import {levenshteinEditDistance} from 'levenshtein-edit-distance'

/** @type {ReadonlyArray<Readonly<Album>>} */
let albums = []
/** @type {ReadonlyArray<Readonly<Artist>>} */
let artists = []

try {
  albums = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/albums.json', import.meta.url))
    )
  )
} catch {}

try {
  artists = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/artists.json', import.meta.url))
    )
  )
} catch {}

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'Things Titus listens to',
  label: 'listening',
  modified: new Date(),
  published: '2020-05-01T00:00:00.000Z',
  title: 'Listening'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Listening (recently)')),
    h('h2', h('span.text', 'Recent artists')),
    h(
      'ol.covers',
      artists.map(function (d) {
        const {image, name} = d

        return h('li.cover-wrap', [
          h('.cover.square', [
            h('img', {
              alt: '',
              height: image.height,
              src: image.url,
              width: image.width
            }),
            h('h2.caption', h('span.text', name))
          ])
        ])
      })
    ),
    h('h2', h('span.text', 'Recent albums')),
    h(
      'ol.covers',
      albums.map(function (d) {
        const {artist, image} = d
        let ignoreArist = /various artists/i.test(artist)
        const name = cleanAlbumName(d.name)
        const similarity =
          1 -
          levenshteinEditDistance(name, artist, true) /
            Math.max(name.length, artist.length)

        if (similarity > 0.9) {
          ignoreArist = true
        }

        if (new RegExp(escape(artist) + '$', 'i').test(name)) {
          ignoreArist = true
        }

        return h('li.cover-wrap', [
          h('.cover.square', [
            h('img', {alt: '', src: image, width: 300}),
            h(
              'h2.caption',
              h('span.text', name),
              ignoreArist ? [] : [h('br'), h('span.text', artist)]
            )
          ])
        ])
      })
    )
  ]
}

/**
 * @param {string} d
 *   Album name.
 * @returns {string}
 *   Clean album name.
 */
function cleanAlbumName(d) {
  return (
    d
      .replace(
        /[([]((\d+(st|nd|rd|th) )?(anniversary )?(deluxe )?(reissue|edition|version)|((international|super|special|standard) )?(deluxe|digital|extended|expanded|explicit|tour|limited|legacy|bonus( track)?|special)(( anniversary)? (reissue|edition|version))?|music from the (motion picture soundtrack|\w+ series)|complete|\w+ version)[)\]]/i,
        ''
      )
      // Case-sensitive, at end.
      .replace(/OST$/, '')
      .replace(
        /(\d+(st|nd|rd|th))?( anniversary)?( deluxe)?( (?:reissue|edition|version))?$/i,
        ''
      )
      .replace(/- (original motion picture soundtrack|the best of .+)/i, '')
      .trim()
  )
}
