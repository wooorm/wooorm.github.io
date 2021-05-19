import fs from 'fs'
import path from 'path'
import escape from 'escape-string-regexp'
import {levenshteinEditDistance} from 'levenshtein-edit-distance'
import {h} from 'hastscript'

var artists = []
var albums = []

try {
  artists = JSON.parse(fs.readFileSync(path.join('data', 'artists.json')))
  albums = JSON.parse(fs.readFileSync(path.join('data', 'albums.json')))
} catch {}

export var data = {
  title: 'Listening',
  label: 'listening',
  description: 'Things Titus listens to',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

export function render() {
  return [
    h('h1', h('span.text', 'Listening (recently)')),
    h('h2', h('span.text', 'Recent artists')),
    h(
      'ol.covers',
      artists.map(function (d) {
        var {image, name} = d

        return h('li.cover.square', [
          h('img', {
            src: image.url,
            alt: '',
            width: image.width,
            height: image.height
          }),
          h('h2.caption', h('span.text', name))
        ])
      })
    ),
    h('h2', h('span.text', 'Recent albums')),
    h(
      'ol.covers',
      albums.map(function (d) {
        var {image, artist} = d
        var name = cleanAlbumName(d.name)
        var similarity =
          1 -
          levenshteinEditDistance(name, artist, true) /
            Math.max(name.length, artist.length)
        var ignoreArist = /various artists/i.test(artist) || similarity > 0.9

        if (new RegExp(escape(artist) + '$', 'i').test(name)) {
          ignoreArist = true
        }

        return h('li.cover.square', [
          h('img', {src: image, alt: '', width: 300}),
          h(
            'h2.caption',
            h('span.text', name),
            ignoreArist ? [] : [h('br'), h('span.text', artist)]
          )
        ])
      })
    )
  ]
}

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
