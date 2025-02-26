/**
 * @import {Metadata, Render} from '../index.js'
 */

import {h} from 'hastscript'

/** @type {Readonly<Metadata>} */
export const data = {
  description: 'A place for Titus on the web',
  label: 'home',
  modified: '2023-12-23T00:00:00.000Z',
  pathname: '/',
  published: '2020-05-01T00:00:00.000Z',
  title: '@wooorm'
}

const downloads = 'https://npm-stat.com/charts.html?author=wooorm'
const email = 'mailto:tituswormer@gmail.com'
const github = 'https://github.com/wooorm'
const masto = 'https://mastodon.social/@wooorm'
const mm = 'https://github.com/micromark/micromark'
const markdownRs = 'https://github.com/wooorm/markdown-rs'
const mdxjsRs = 'https://github.com/wooorm/mdxjs-rs'
const projects =
  'https://github.com/search?type=Repositories&q=user:wooorm+user:mdx-js+user:micromark+user:remarkjs+user:rehypejs+user:retextjs+user:unifiedjs+user:syntax-tree+user:vfile+user:get-alex+user:words'
const resume = '/resume.html'
const thanks = '/thanks/'

/** @type {Render} */
export function render() {
  return [
    h('.content', [
      h('h1', h('span.text', 'Hi, I’m Titus 👋')),
      h('p', [
        h('span.text', [
          'I do a lot of ',
          h('a', {href: github}, 'open source'),
          '; I maintain ',
          h('a', {href: projects}, '550+ projects'),
          ' that are downloaded ',
          h('a', {href: downloads}, '38B+ times'),
          ' a year. ',
          'Most project have to do with content (markup, markdown) and syntax trees. ',
          'I can spend time building things ',
          h('a', {href: thanks}, 'thanks to the community'),
          '.'
        ])
      ]),
      h(
        'p',
        h('span.text', [
          'I sometimes do contracting as well. ',
          'Previously for Vercel on ',
          h('a', {href: markdownRs}, h('code', 'markdown-rs')),
          ' and ',
          h('a', {href: mdxjsRs}, h('code', 'mdxjs-rs')),
          ', Salesforce on parts of ',
          h('a', {href: mm}, h('code', 'micromark')),
          ', Holloway on books, and Gatsby. ',
          'A while ago I used to teach data visualisation, frontend, and backend.'
        ])
      ),
      h(
        'p',
        h('span.text', 'Here are a couple places you can find me online:')
      ),
      h('ul', [
        h(
          'li',
          h('span.text', [
            h('a', {href: 'https://bsky.app/profile/wooorm.bsky.social'}, [
              'wooorm.',
              h('strong', 'bsky'),
              '.social'
            ])
          ])
        ),
        h(
          'li',
          h('span.text', [
            h('a', {href: masto}, [h('strong', 'mastodon'), '.social/@wooorm'])
          ])
        ),
        h(
          'li',
          h('span.text', [
            h('a', {href: github}, [h('strong', 'github'), '.com/wooorm'])
          ])
        ),
        h(
          'li',
          h('span.text', [
            h('a', {href: email}, [
              'tituswormer@g',
              h('strong', 'mail'),
              '.com'
            ])
          ])
        )
      ]),
      h(
        'p',
        h('span.text', 'Here’s ', h('a', {href: resume}, 'my résumé'), '.')
      )
    ])
  ]
}
