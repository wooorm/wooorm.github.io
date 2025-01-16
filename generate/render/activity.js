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
          h(
            'span',
            'I am still on the streets but I stopped sharing activities in an attempt to make running more about running instead of kudos. My most recent race was the marathon in '
          ),
          h('strong', 'Valencia'),
          h('span', ' where I ran 2:49:13!')
        )
      )
    ])
  ]
}
