import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import {h} from 'hastscript'

const photos = yaml
  .load(fs.readFileSync(path.join('asset', 'image', 'index.yml')))
  .sort(sort)

export const data = {
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

function sort(a, b) {
  return pick(b) - pick(a)
}

function pick(d) {
  return d.date
}
