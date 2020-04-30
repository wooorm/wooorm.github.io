'use strict'

var h = require('hastscript')
var shows = require('../../data/shows.json')

exports.data = {
  title: 'Watching',
  label: 'watching',
  description: 'Things Titus watches',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

exports.render = watching

function watching() {
  var items = shows
    .filter((d) => d.image)
    .slice(0, 50)
    .map(map)

  return [h('h1', h('span.text', 'Watching (recently)')), h('ol.covers', items)]
}

function map(d) {
  return h('li.cover', [
    h('img', {
      src: d.image.url,
      alt: '',
      width: 300,
      height: Math.floor(d.image.height / (d.image.width / 300))
    }),
    h(
      'h2.caption',
      h('span.text', d.title),
      h('br'),
      h('span.text', '(' + d.year + ')')
    )
  ])
}
