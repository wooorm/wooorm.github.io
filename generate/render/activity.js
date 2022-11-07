/**
 * @typedef {import('../../crawl/activity.js').Activity} Activity
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 */

import fs from 'node:fs/promises'
import {h} from 'hastscript'
import polyline from '@mapbox/polyline'

/** @type {Array<Activity>} */
let activities = []

try {
  activities = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/activities.json', import.meta.url))
    )
  )
} catch {}

/** @type {MetadataRaw} */
export const data = {
  title: 'Activity',
  label: 'activity',
  description: 'Titus moves',
  published: '2021-12-25T00:00:00.000Z',
  modified: new Date()
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Activity')),
    h('.content', [
      h(
        'p',
        h('span.text', ['Here are some of my recent runs and bike rides:'])
      )
    ]),
    h(
      'ol.pictures',
      activities.map((d) => map(d))
    )
  ]
}

/**
 * @param {Activity} d
 */
function map(d) {
  const line = polyline.decode(d.polyline)
  let minX = 0
  let minY = 0
  let maxX = 0
  let maxY = 0

  for (const [i, tuple] of line.entries()) {
    if (i === 0) {
      minX = tuple[1]
      maxX = tuple[1]
      minY = tuple[0]
      maxY = tuple[0]
    } else {
      minX = Math.min(tuple[1], minX)
      minY = Math.min(tuple[0], minY)
      maxX = Math.max(tuple[1], maxX)
      maxY = Math.max(tuple[0], maxY)
    }
  }

  const mapWidth = maxX - minX
  const mapHeight = maxY - minY
  const mapCenterX = (maxX + minX) / 2
  const mapCenterY = (maxY + minY) / 2
  const size = 200
  const scale = Math.min(size / mapWidth, size / mapHeight)

  return h('li.picture-root', [
    h('.picture-wrap', [
      h('.picture', [
        h('svg', {viewBox: [0, 0, size, size].join(' ')}, [
          h('rect', {x: 0, y: 0, width: size, height: size, fill: 'white'}),
          h('path', {
            strokeWidth: 1.5,
            stroke: 'black',
            fill: 'none',
            d:
              'M' +
              line
                .flatMap((p) => [
                  (p[1] - mapCenterX) * scale + size / 2,
                  (mapCenterY - p[0]) * scale + size / 2
                ])
                .join(' ')
          })
        ]),
        h('.caption', [
          h('h2', h('span.text', d.date)),
          h(
            'p',
            h(
              'span.text',
              'distance: ' +
                d.distance +
                ' · duration: ' +
                d.duration +
                ' · pace: ' +
                d.speed +
                '/km'
            )
          )
        ])
      ])
    ])
  ])
}
