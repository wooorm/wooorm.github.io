'use strict'

var distance = require('levenshtein-edit-distance')
var h = require('hastscript')
var music = require('../../data/music.json')

exports.data = {
  title: 'Listening',
  label: 'listening',
  description: 'Things Titus listens to',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

exports.render = listening

function listening() {
  var items = music.map(map)

  return [
    h('h1', h('span.text', 'Listening (recently)')),
    h('ol.covers', items)
  ]
}

function map(d) {
  var {image, artist} = d
  var name = cleanName(d.name)
  var similarity =
    1 - distance(name, artist, true) / Math.max(name.length, artist.length)
  var ignoreArist = /various artists/i.test(artist) || similarity > 0.9

  return h('li.cover', [
    h('img', {src: image, alt: '', width: 300}),
    h(
      'h2.caption',
      h('span.text', name),
      ignoreArist ? [] : [h('br'), h('span.text', artist)]
    )
  ])
}

function cleanName(d) {
  return d
    .replace(
      /\(((\d+(st|nd|rd|th)( anniversary)? (reissue|edition))|((super|special) )?(deluxe|extended|expanded|explicit|limited|legacy|bonus track)(( anniversary)? (reissue|edition|version))?|music from the (motion picture soundtrack|\w+ series)|complete)\)/i,
      ''
    )
    .replace(/- (original motion picture soundtrack|the best of .+)/i, '')
    .trim()
}
