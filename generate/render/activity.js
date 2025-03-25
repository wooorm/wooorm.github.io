/**
 * @import {Element} from 'hast'
 * @import {Metadata, Render} from '../index.js'
 */

import {h} from 'hastscript'

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
      h(
        'p',
        h(
          'span.text',
          'I am still on the streets but I stopped sharing activities in an attempt to make running more about running instead of kudos. Here are some of my races:'
        )
      ),
      h('table', [
        h('tr', [
          h('th', h('span.text', 'Name')),
          h('th', h('span.text', 'Date')),
          h('th', h('span.text', 'Distance')),
          h('th', h('span.text', 'Time'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Maratón de Valencia')),
          h('td', h('span.text', '2024-12-01')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '2:49:13'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Rotterdam ¼ marathon')),
          h('td', h('span.text', '2024-04-14')),
          h('td', h('span.text', '10.55 km')),
          h('td', h('span.text', '0:39:54'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Chicago marathon')),
          h('td', h('span.text', '2023-10-08')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '2:58:48'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Maratón de Sevilla')),
          h('td', h('span.text', '2023-02-19')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '3:06:14'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Amsterdam marathon')),
          h('td', h('span.text', '2022-10-16')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '3:03:50'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Rotterdam marathon')),
          h('td', h('span.text', '2022-04-10')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '3:14:21'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Leiden marathon')),
          h('td', h('span.text', '2021-10-10')),
          h('td', h('span.text', '42.195 km')),
          h('td', h('span.text', '3:41:45'))
        ]),
        h('tr', [
          h('th', h('span.text', 'Leiden ½ marathon')),
          h('td', h('span.text', '2021-10-10')),
          h('td', h('span.text', '21.10 km')),
          h('td', h('span.text', '1:41:22'))
        ])
      ])
    ])
  ]
}
