import fs from 'fs'
import path from 'path'
import h from 'hastscript'

var shows = []

try {
  shows = JSON.parse(fs.readFileSync(path.join('data', 'shows.json')))
} catch {}

export var data = {
  title: 'Watching',
  label: 'watching',
  description: 'Things Titus watches',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

export function render() {
  return [
    h('h1', h('span.text', 'Watching (recently)')),
    h(
      'ol.covers',
      shows
        .filter((d) => d.image)
        .slice(0, 50)
        .map(function (d) {
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
        })
    )
  ]
}
