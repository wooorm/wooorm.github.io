/**
 * @typedef {ThingRaw & ImageFields} Thing
 *
 * @typedef ImageFields
 * @property {Image} [image]
 *
 * @typedef Image
 * @property {number} width
 * @property {number} height
 * @property {string} url
 *
 * @typedef ThingRaw
 * @property {string} title
 * @property {'show'|'movie'} type
 * @property {number} year
 * @property {Date} last
 * @property {number} tmdbId
 *
 * @typedef TmdbImage
 * @property {number} aspect_ratio
 * @property {number} height
 * @property {string|null} iso_639_1
 * @property {string} file_path
 * @property {number} vote_average
 * @property {number} vote_count
 * @property {number} width
 *
 * @typedef TmdbImageResponse
 * @property {Array<TmdbImage>} backdrops
 * @property {number} id
 * @property {Array<TmdbImage>} logos
 * @property {Array<TmdbImage>} posters
 *
 * @typedef TraktIds
 * @property {number} trakt
 * @property {string} [slug]
 * @property {number|null} tvdb
 * @property {string} imdb
 * @property {number} tmdb
 * @property {number|null} tvrage
 *
 * @typedef TraktEpisode
 * @property {number} season
 * @property {number} number
 * @property {string} title
 * @property {TraktIds} ids
 *
 * @typedef TraktMovie
 *   Note: might include more results.
 * @property {number} year
 * @property {string} title
 * @property {TraktIds} ids
 *
 * @typedef TraktShow
 * @property {string} title
 * @property {number} year
 * @property {TraktIds} ids
 *
 * @typedef TraktHistoryEpisode
 * @property {number} id
 * @property {string} watched_at
 * @property {unknown} action
 * @property {'episode'} type
 * @property {TraktEpisode} episode
 * @property {TraktShow} show
 *
 * @typedef TraktHistoryMovie
 * @property {number} id
 * @property {string} watched_at
 * @property {unknown} action
 * @property {'movie'} type
 * @property {TraktMovie} movie
 *
 * @typedef {TraktHistoryEpisode|TraktHistoryMovie} TraktHistoryEntry
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import all from 'p-all'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ttvKey = process.env.TTV_TOKEN
const user = process.env.TTV_USER
const tmdbKey = process.env.TMDB_TOKEN

if (!ttvKey) throw new Error('Missing `TTV_TOKEN`')
if (!user) throw new Error('Missing `TTV_USER`')
if (!tmdbKey) throw new Error('Missing `TMDB_TOKEN`')

const outUrl = new URL('../data/shows.json', import.meta.url)

const languages = ['en', 'nl', 'fr', 'de', 'it', 'es']

const response = await fetch(
  'https://api.trakt.tv/users/' + user + '/history?limit=300',
  {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-version': '2',
      'trakt-api-key': ttvKey
    }
  }
)
const body = /** @type {Array<TraktHistoryEntry>} */ (await response.json())

/** @type {Array<ThingRaw>} */
const flat = body.flatMap((d) => {
  if (d.type === 'movie') {
    return {
      title: d.movie.title,
      type: d.type,
      year: d.movie.year,
      last: new Date(d.watched_at),
      tmdbId: d.movie.ids.tmdb
    }
  }

  // Ignore info on the episode, just take the show.
  return {
    title: d.show.title,
    type: 'show',
    year: d.show.year,
    last: new Date(d.watched_at),
    tmdbId: d.show.ids.tmdb
  }
})

/** @type {Record<number, ThingRaw>} */
const byId = {}
let index = -1

while (++index < flat.length) {
  if (!(flat[index].tmdbId in byId)) {
    byId[flat[index].tmdbId] = flat[index]
  }
}

const items = Object.values(byId)

items.sort(sort)

const data = await all(
  items.map((d) => () => getImage(d)),
  {concurrency: 2}
)

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(data, null, 2) + '\n')

/**
 * @param {ThingRaw} a
 * @param {ThingRaw} b
 */
function sort(a, b) {
  return score(b).valueOf() - score(a).valueOf()
}

/**
 * @param {ThingRaw} d
 */
function score(d) {
  return d.last
}

/**
 * @param {ThingRaw} d
 */
async function getImage(d) {
  /** @type {Thing} */
  const copy = {...d}

  try {
    const endpoint =
      'https://api.themoviedb.org/3/' +
      (d.type === 'show' ? 'tv' : d.type) +
      '/' +
      d.tmdbId +
      '/images' +
      '?api_key=' +
      tmdbKey

    const response = await fetch(endpoint, {
      headers: {'Content-Type': 'application/json'}
    })
    const body = /** @type {TmdbImageResponse} */ (await response.json())

    const posters = body.posters.sort((a, b) => b.vote_average - a.vote_average)
    let image = posters[0]

    languages.some((l) => {
      const poster = posters.find((d) => d.iso_639_1 === l)
      if (poster) image = poster
      return Boolean(poster)
    })

    copy.image = {
      width: image.width,
      height: image.height,
      url: 'https://image.tmdb.org/t/p/w300' + image.file_path
    }
  } catch {
    console.warn('Could not get image for:', d.title)
  }

  return copy
}
