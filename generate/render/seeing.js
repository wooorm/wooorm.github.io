'use strict'

var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml')
var h = require('hastscript')

var photos = yaml
  .safeLoad(fs.readFileSync(path.join('asset', 'image', 'index.yml')))
  .sort(sort)

exports.data = {
  title: 'Photos',
  label: 'photos',
  description: 'Things Titus sees',
  published: '2020-05-01T00:00:00.000Z',
  modified: photos[photos.length - 1].date
}

exports.render = seeing

function seeing() {
  var items = photos.map(map)

  return [h('h1', h('span.text', 'Seeing')), h('ol.pictures', items)]
}

function map(d) {
  return h('li.picture', [
    h('img', {src: '/image/' + d.name, alt: ''}),
    h('h2.caption', h('span.text', d.title))
  ])
}

function sort(a, b) {
  return pick(b) - pick(a)
}

function pick(d) {
  return d.date
}
