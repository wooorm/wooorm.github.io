import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import {h} from 'hastscript'

var photos = yaml
  .load(fs.readFileSync(path.join('asset', 'image', 'index.yml')))
  .sort(sort)

export var data = {
  title: 'Photos',
  label: 'photos',
  description: 'Things Titus sees',
  published: '2020-05-01T00:00:00.000Z',
  modified: photos[photos.length - 1].date
}

export function render() {
  return [
    h('h1', h('span.text', 'Seeing')),
    h(
      'ol.pictures',
      photos.map(function (d) {
        return h('li.picture', [
          h('img', {src: '/image/' + d.name, alt: ''}),
          h('h2.caption', h('span.text', d.title))
        ])
      })
    )
  ]
}

function sort(a, b) {
  return pick(b) - pick(a)
}

function pick(d) {
  return d.date
}
