'use strict'

var escape = require('escape-string-regexp')
var distance = require('levenshtein-edit-distance')
var h = require('hastscript')
var artists
var albums

try {
  artists = require('../../data/artists.json')
  albums = require('../../data/albums.json')
} catch (_) {
  artists = []
  albums = []
}

exports.data = {
  title: 'Listening',
  label: 'listening',
  description: 'Things Titus listens to',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

exports.render = listening

function listening() {
  return [
    h('h1', h('span.text', 'Listening (recently)')),
    h('h2', h('span.text', 'Recent artists')),
    h('ol.covers', artists.map(artist)),
    h('h2', h('span.text', 'Recent albums')),
    h('ol.covers', albums.map(album))
  ]
}

function artist(d) {
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
}

function album(d) {
  var {image, artist} = d
  var name = cleanAlbumName(d.name)
  var similarity =
    1 - distance(name, artist, true) / Math.max(name.length, artist.length)
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
