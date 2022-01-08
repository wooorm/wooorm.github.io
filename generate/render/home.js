import {h} from 'hastscript'

export const data = {
  title: '@wooorm',
  label: 'home',
  pathname: '/',
  description: 'A place for Titus on the web',
  published: '2020-05-01T00:00:00.000Z',
  modified: '2020-05-01T00:00:00.000Z'
}

const github = 'https://github.com/wooorm'
const twitter = 'https://twitter.com/wooorm'
const email = 'mailto:tituswormer@gmail.com'
const unified = 'https://unifiedjs.com'
const tt = 'https://github.com/cmda-tt/course-18-19'
const backend = 'https://github.com/cmda-be/course-17-18'
const projects =
  'https://github.com/search?type=Repositories&q=user:wooorm+user:mdx-js+user:micromark+user:remarkjs+user:rehypejs+user:retextjs+user:unifiedjs+user:syntax-tree+user:vfile+user:get-alex+user:words'
const downloads = 'https://npm-stat.com/charts.html?author=wooorm'
const thanks = '/thanks/'
const mm = 'https://github.com/micromark/micromark'
const mdxsm = 'https://github.com/micromark/mdx-state-machine'
const books = 'https://twitter.com/SparksZilla/status/1222208487351971840'
const resume = '/resume.html'

export function render() {
  return [
    h('.content', [
      h('h1', h('span.text', 'Hi, I’m Titus 👋')),
      h('p', [
        h('span.text', [
          'I work most-time on ',
          h('a', {href: github}, 'open source'),
          ' maintaining ',
          h('a', {href: projects}, '540+ projects'),
          ' that are downloaded ',
          h('a', {href: downloads}, '15B+ times'),
          ' a year. ',
          'I can spend part of my time as a core team member of ',
          h('a', {href: unified}, 'unified'),
          ', building things for content (natural language, markdown, markup) with syntax trees, ',
          h('a', {href: thanks}, 'thanks'),
          ' to the community.'
        ])
      ]),
      h(
        'p',
        h('span.text', [
          'I sometimes do contracting as well. Recently for ',
          h('a', {href: mm}, 'Salesforce who funded part of micromark'),
          ', ',
          h('a', {href: mdxsm}, 'Gatsby speccing MDX'),
          ', and ',
          h('a', {href: books}, 'Holloway making books'),
          '. ',
          'And I used to teach ',
          h('a', {href: tt}, 'data visualisation, frontend'),
          ', and ',
          h('a', {href: backend}, 'backend'),
          ' for a while.'
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
            h('a', {href: twitter}, [h('strong', 'twitter'), '.com/wooorm'])
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
        h('span.text', '…or view ', h('a', {href: resume}, 'my résumé'), '.')
      )
    ])
  ]
}
