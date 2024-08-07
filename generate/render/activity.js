/**
 * @import {Element} from 'hast'
 * @import {Activity} from '../../crawl/activity.js'
 * @import {Metadata, Render} from '../index.js'
 */

import fs from 'node:fs/promises'
import polyline from '@mapbox/polyline'
import {h} from 'hastscript'

/** @type {ReadonlyArray<Readonly<Activity>>} */
let activities = []

try {
  activities = JSON.parse(
    String(
      await fs.readFile(new URL('../../data/activities.json', import.meta.url))
    )
  )
} catch {}

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'Titus moves',
  label: 'activity',
  modified: new Date(),
  published: '2021-12-25T00:00:00.000Z',
  title: 'Activity'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Activity')),
    h('.content', [
      h('p', h('span.text', 'Here are some of my recent runs and bike rides:'))
    ]),
    h(
      'ol.pictures',
      activities.map(function (d) {
        return map(d)
      })
    )
  ]
}

/**
 * @param {Readonly<Activity>} d
 *   Activity.
 * @returns {Element}
 *   Element.
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
          h('rect', {fill: 'white', height: size, width: size, x: 0, y: 0}),
          h('path', {
            d:
              'M' +
              line
                .flatMap(function (p) {
                  return [
                    (p[1] - mapCenterX) * scale + size / 2,
                    (mapCenterY - p[0]) * scale + size / 2
                  ]
                })
                .join(' '),
            fill: 'none',
            stroke: 'black',
            strokeWidth: 1.5
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
