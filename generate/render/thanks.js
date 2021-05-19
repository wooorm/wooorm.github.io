import fs from 'fs'
import path from 'path'
import url from 'humanize-url'
import {h} from 'hastscript'

var ghSponsors = []
var ocSponsors = []

try {
  ghSponsors = JSON.parse(
    fs.readFileSync(path.join('data', 'github-sponsors.json'))
  )
  ocSponsors = JSON.parse(
    fs.readFileSync(path.join('data', 'opencollective.json'))
  )
} catch {}

export var data = {
  title: 'Thanks',
  label: 'thanks',
  description: 'People Titus wants to thank',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

export function render() {
  return [
    h('h1', h('span.text', 'Thanks')),
    h('.content', [
      h(
        'p',
        h('span.text', [
          'I do ',
          h(
            'a',
            {href: 'https://github.com/sponsors/wooorm'},
            'most-time open source'
          ),
          ', funded by the community. You can support me:'
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
            ' (personal; monthly)'
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
            ' (unified; monthly or one-time)'
          ])
        ),
        h(
          'li',
          h('span.text', [
            h('a', {href: 'https://www.paypal.me/wooorm'}, 'PayPall'),
            ' (personal; one-time)'
          ])
        )
      ])
    ]),
    h('h2', h('span.text', 'Personal')),
    h(
      'p',
      h('span.text', [
        'Thanks to these people for their ',
        h(
          'a',
          {href: 'https://github.com/sponsors/wooorm'},
          'personal support'
        ),
        ':'
      ])
    ),
    h(
      'ol.cards',
      ghSponsors.map((d) => map(d))
    ),
    h('h2', h('span.text', 'unified')),
    h(
      'p',
      h('span.text', [
        'Thanks to these backers for their ',
        h(
          'a',
          {href: 'https://opencollective.com/unified'},
          'support of unified'
        ),
        ':'
      ])
    ),
    h(
      'ol.cards',
      ocSponsors.map((d) => map(d))
    )
  ]
}

function map(d) {
  var gh = d.github ? 'https://github.com/' + d.github : ''
  var href = d.url

  if (gh && href === gh) {
    href = null
  }

  if (href && !/^https?:/.test(href)) {
    href = 'http://' + href
  }

  return h('li.card', [
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
}
