'use strict'

var url = require('humanize-url')
var h = require('hastscript')
var ghSponsors = require('../../data/github-sponsors.json')
var ocSponsors = require('../../data/opencollective.json')

exports.data = {
  title: 'Thanks',
  label: 'thanks',
  description: 'People Titus wants to thank',
  published: '2020-05-01T00:00:00.000Z',
  modified: Date.now()
}

exports.render = thanks

function thanks() {
  var gh = ghSponsors.map(map)
  var oc = ocSponsors.map(map)

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
    h('ol.cards', gh),
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
    h('ol.cards', oc)
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
            href ? h('span.text', h('a', {href}, url(href))) : ''
          )
        : ''
    ])
  ])
}