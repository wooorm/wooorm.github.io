/**
 * @typedef {import('../../crawl/artists.js').Artist} Artist
 * @typedef {import('../../crawl/albums.js').Album} Album
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 */

import fs from 'node:fs/promises'
import escape from 'escape-string-regexp'
import {levenshteinEditDistance} from 'levenshtein-edit-distance'
import {h} from 'hastscript'

/** @type {Array<Artist>} */
let artists = []
/** @type {Array<Album>} */
let albums = []

try {
  artists = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/artists.json', import.meta.url))
    )
  )
  albums = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/albums.json', import.meta.url))
    )
  )
} catch {}

/** @type {MetadataRaw} */
export const data = {
  title: 'Listening',
  label: 'listening',
  description: 'Things Titus listens to',
  published: '2020-05-01T00:00:00.000Z',
  modified: new Date()
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Listening (recently)')),
    h('h2', h('span.text', 'Recent artists')),
    h(
      'ol.covers',
      artists.map((d) => {
        const {image, name} = d

        return h('li.cover-wrap', [
          h('.cover.square', [
            h('img', {
              src: image.url,
              alt: '',
              width: image.width,
              height: image.height
            }),
            h('h2.caption', h('span.text', name))
          ])
        ])
      })
    ),
    h('h2', h('span.text', 'Recent albums')),
    h(
      'ol.covers',
      albums.map((d) => {
        const {image, artist} = d
        const name = cleanAlbumName(d.name)
        const similarity =
          1 -
          levenshteinEditDistance(name, artist, true) /
            Math.max(name.length, artist.length)
        let ignoreArist = /various artists/i.test(artist) || similarity > 0.9

        if (new RegExp(escape(artist) + '$', 'i').test(name)) {
          ignoreArist = true
        }

        return h('li.cover-wrap', [
          h('.cover.square', [
            h('img', {src: image, alt: '', width: 300}),
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
