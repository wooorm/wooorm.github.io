/**
 * @import {Element} from 'hast'
 * @import {Sponsors as GhSponsors, Sponsor as GhSponsor} from '../../crawl/github-sponsors.js'
 * @import {Sponsor as OcSponsor} from '../../crawl/opencollective.js'
 * @import {Metadata, Render} from '../index.js'
 */

import fs from 'node:fs/promises'
import {h} from 'hastscript'
import url from 'humanize-url'

/** @type {Readonly<GhSponsors>} */
let ghSponsors = {collective: [], personal: []}
/** @type {ReadonlyArray<Readonly<OcSponsor>>} */
let ocSponsors = []

try {
  ghSponsors = JSON.parse(
    String(
      await fs.readFile(
        new URL('../../data/github-sponsors.json', import.meta.url)
      )
    )
  )
} catch {}

try {
  ocSponsors = JSON.parse(
    String(
      await fs.readFile(
        new URL('../../data/opencollective.json', import.meta.url)
      )
    )
  )
} catch {}

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'People Titus wants to thank',
  label: 'thanks',
  modified: new Date(),
  published: '2020-05-01T00:00:00.000Z',
  title: 'Thanks'
}

/** @type {Render} */
export function render() {
  return [
    h('h1', h('span.text', 'Thanks')),
    h('.content', [
      h(
        'p',
        h('span.text', [
          'I do a lot of open source, partially funded by the community. You can support me:'
        ])
      ),
      h('ul', [
        h(
          'li',
          h('span.text', [
            h('strong', [
              h(
                'a',
                {href: 'https://github.com/sponsors/wooorm'},
                'GitHub Sponsors'
              )
            ]),
            ' (personal; monthly or one-time)'
          ])
        ),
        h(
          'li',
          h('span.text', [
            h('a', {href: 'https://thanks.dev'}, h('code', 'thanks.dev')),
            ' (your entire codebase)'
          ])
        ),
        h(
          'li',
          h('span.text', [
            h(
              'a',
              {href: 'https://opencollective.com/unified'},
              'OpenCollective'
            ),
            ' or ',
            h(
              'a',
              {href: 'https://github.com/sponsors/unifiedjs'},
              'GitHub Sponsors'
            ),
            ' (unified; monthly or one-time)'
          ])
        )
      ])
    ]),
    h(
      'h2',
      h(
        'span.text',
        h('a', {href: 'https://github.com/sponsors/wooorm'}, 'Personal')
      )
    ),
    h(
      'ol.cards',
      ghSponsors.personal.map(function (d) {
        return map(d)
      })
    ),
    h('h2', h('span.text', 'unified')),
    h(
      'h3',
      h(
        'span.text',
        h('a', {href: 'https://github.com/sponsors/unifiedjs'}, 'GitHub')
      )
    ),
    h(
      'ol.cards',
      ghSponsors.collective.map(function (d) {
        return map(d)
      })
    ),
    h(
      'h3',
      h(
        'span.text',
        h('a', {href: 'https://opencollective.com/unified'}, 'OpenCollective')
      )
    ),
    h(
      'ol.cards',
      ocSponsors.map(function (d) {
        return map(d)
      })
    )
  ]
}

/**
 * @param {Readonly<GhSponsor> | Readonly<OcSponsor>} d
 *   Sponsor.
 * @returns {Element}
 *   Element.
 */
function map(d) {
  const gh = d.github ? 'https://github.com/' + d.github : ''
  let href = d.url

  if (gh && href === gh) {
    href = undefined
  }

  if (href && !/^https?:/.test(href)) {
    href = 'http://' + href
  }

  return h('li.card-wrap', [
    h('.card', [
      h('.caption', [
        h('h3', h('span.text', d.name)),
        gh || href
          ? h(
              'p',
              gh ? h('span.text', h('a', {href: gh}, ['@' + d.github])) : '',
              gh && href ? h('span.text', ' · ') : '',
              href
                ? h(
                    'span.text',
                    h('a', {href, rel: ['nofollow', 'sponsored']}, url(href))
                  )
                : ''
            )
          : ''
      ])
    ])
  ])
}
