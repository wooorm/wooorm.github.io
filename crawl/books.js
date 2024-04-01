/**
 * @typedef Book
 * @property {string} author
 * @property {string} title
 * @property {number | undefined} review
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {fromHtml} from 'hast-util-from-html'
import {select, selectAll} from 'hast-util-select'
import {toText} from 'hast-util-to-text'
import {fetch} from 'undici'
import {visit} from 'unist-util-visit'

const outUrl = new URL('../data/books.json', import.meta.url)

// Note: there’s no TSG (TheStoryGraph) API, so we’re scraping the website manually.
// No tokens either, so it’s all just hardcoded for now, including the username.
const url = 'https://app.thestorygraph.com/books-read/wooorm'

const results = await Promise.all(
  [1, 2, 3].map(async function (page) {
    const response = await fetch(url + '?page=' + page)
    const value = await response.text()
    const tree = fromHtml(value)

    visit(tree, function (node, index, parent) {
      if (
        parent &&
        typeof index === 'number' &&
        node.type === 'element' &&
        Array.isArray(node.properties.className) &&
        node.properties.className.includes('hidden')
      ) {
        parent.children.splice(index, 1)
        return index
      }
    })

    const container = select('.read-books', tree)
    assert(container, 'expected list of read books')

    /** @type {Array<Book>} */
    const books = []

    for (const book of selectAll('.book-pane', container)) {
      const parts = selectAll('.book-title-author-and-series a', book)
      const title = parts.shift()
      // There can be “series” info in between.
      const author = parts.pop()
      const review = select('.icon-star + span', book)
      assert(title, 'expected title')
      assert(author, 'expected author')

      let cleanTitle = toText(title)

      const colon = cleanTitle.indexOf(':')

      if (colon !== -1) {
        cleanTitle = cleanTitle.slice(0, colon)
      }

      cleanTitle = cleanTitle.trim()

      books.push({
        title: cleanTitle,
        author: toText(author),
        review: review ? Number.parseFloat(toText(review)) : undefined
      })
    }

    return books
  })
)

const books = results.flat()

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(books, undefined, 2) + '\n')
