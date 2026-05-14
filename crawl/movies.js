/**
 * @import {Cdata, Element} from 'xast'
 */

/**
 * @typedef Image
 *   Image.
 * @property {number} height
 *   Height.
 * @property {string} url
 *   URL.
 * @property {number} width
 *   Width.
 */

/**
 * @typedef Movie
 *   Movie.
 * @property {Readonly<Image>} image
 *   Image.
 * @property {Readonly<Date>} last
 *   Last watched.
 * @property {number} rating
 *   Rating.
 * @property {string} title
 *   Title.
 * @property {string} url
 *   Link to movie on Letterboxd.
 * @property {number} year
 *   Year.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import {fromHtml} from 'hast-util-from-html'
import {select as selectHast} from 'hast-util-select'
import {fetch} from 'undici'
import {selectAll, select} from 'unist-util-select'
import {fromXml} from 'xast-util-from-xml'
import {toString} from 'xast-util-to-string'

try {
  process.loadEnvFile()
} catch {
  // Ignore.
}

const lboxUser = process.env.LBOX_USER

if (!lboxUser) throw new Error('Missing `LBOX_USER`')

const outUrl = new URL('../data/movies.json', import.meta.url)
const response = await fetch('https://letterboxd.com/' + lboxUser + '/rss/')

if (!response.ok) {
  throw new Error(
    'Could not fetch Letterboxd feed (`' +
      response.status +
      '`) for user `' +
      lboxUser +
      '`'
  )
}

const tree = fromXml(await response.text())
const items = selectAll('element[name="item"]', tree)

/** @type {Array<Movie>} */
const entries = []

for (const item of items) {
  const $description = /** @type {Cdata | undefined} */ (
    select('element[name="description"] cdata', item)
  )
  const $link = /** @type {Element | undefined} */ (
    select('element[name="link"]', item)
  )
  const $rating = /** @type {Element | undefined} */ (
    select('element[name="letterboxd:memberRating"]', item)
  )
  const $title = /** @type {Element | undefined} */ (
    select('element[name="letterboxd:filmTitle"]', item)
  )
  const $watched = /** @type {Element | undefined} */ (
    select('element[name="letterboxd:watchedDate"]', item)
  )
  const $year = /** @type {Element | undefined} */ (
    select('element[name="letterboxd:filmYear"]', item)
  )

  // Important for debugging.
  const url = $link ? toString($link) : undefined

  if (!$description || !$rating || !$title || !$watched || !$year || !url) {
    console.warn('No info for item, skipping', url)
    continue
  }

  const description = fromHtml(toString($description), {fragment: true})
  const $img = selectHast('img', description)

  if (!$img) {
    console.warn('No image for `%s`, skipping', url)
    continue
  }

  entries.push({
    image: {height: 900, url: String($img.properties.src), width: 600},
    last: new Date(toString($watched)),
    rating: Number.parseFloat(toString($rating)) * 2,
    title: toString($title),
    url,
    year: Number.parseInt(toString($year), 10)
  })
}

const data = entries.toSorted(sort)

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(data, undefined, 2) + '\n')

/**
 * @param {Readonly<Movie>} a
 *   Left.
 * @param {Readonly<Movie>} b
 *   Right.
 * @returns {number}
 *   Sort value.
 */
function sort(a, b) {
  return score(b).valueOf() - score(a).valueOf()
}

/**
 * @param {Readonly<Movie>} d
 *   Movie.
 * @returns {Readonly<Date>}
 *   Score.
 */
function score(d) {
  return d.last
}
