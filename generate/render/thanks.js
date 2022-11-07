/**
 * @typedef {import('../../crawl/github-sponsors.js').Sponsors} GhSponsors
 * @typedef {import('../../crawl/github-sponsors.js').Sponsor} GhSponsor
 * @typedef {import('../../crawl/opencollective.js').Sponsor} OcSponsor
 * @typedef {import('../index.js').Render} Render
 * @typedef {import('../index.js').MetadataRaw} MetadataRaw
 */

import fs from 'node:fs/promises'
import url from 'humanize-url'
import {h} from 'hastscript'

/** @type {GhSponsors} */
let ghSponsors = {collective: [], personal: []}
/** @type {Array<OcSponsor>} */
let ocSponsors = []

try {
  ghSponsors = JSON.parse(
    String(
      await fs.readFile(
        new URL('../../data/github-sponsors.json', import.meta.url)
      )
    )
  )
  ocSponsors = JSON.parse(
    String(
      await fs.readFile(
        new URL('../../data/opencollective.json', import.meta.url)
      )
    )
  )
} catch {}

/** @type {MetadataRaw} */
export const data = {
  title: 'Thanks',
  label: 'thanks',
  description: 'People Titus wants to thank',
  published: '2020-05-01T00:00:00.000Z',
  modified: new Date()
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
      ghSponsors.personal.map((d) => map(d))
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
      ghSponsors.collective.map((d) => map(d))
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
      ocSponsors.map((d) => map(d))
    )
  ]
}

/**
 * @param {OcSponsor|GhSponsor} d
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
                    h('a', {href, rel: ['sponsored', 'nofollow']}, url(href))
                  )
                : ''
            )
          : ''
      ])
    ])
  ])
}
