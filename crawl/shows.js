/**
 * @typedef Image
 *   Image.
 * @property {number} height
 *   Height.
 * @property {string} url
 *   URL.
 * @property {number} width
 *   Width.
 *
 * @typedef ImageFields
 *   Image fields.
 * @property {Readonly<Image> | undefined} [image]
 *   Image.
 *
 * @typedef {ImageFields & ThingRaw} Thing
 *   Thing.
 *
 * @typedef TmdbImage
 *   The Movie Database image.
 * @property {number} aspect_ratio
 *   Aspect ratio.
 * @property {string} file_path
 *   File path.
 * @property {number} height
 *   Height.
 * @property {string | null} iso_639_1
 *   ISO 639-1.
 * @property {number} vote_average
 *   Vote average.
 * @property {number} vote_count
 *   Vote count.
 * @property {number} width
 *   Width.
 *
 * @typedef ThingRaw
 *   Thing (raw).
 * @property {Readonly<Date>} last
 *   Last watched.
 * @property {number | undefined} [rating]
 *   Rating.
 * @property {string} title
 *   Title.
 * @property {number} tmdbId
 *   The Movie Database ID.
 * @property {'movie' | 'show'} type
 *   Type.
 * @property {number} year
 *   Year.
 *
 * @typedef TmdbImageResponse
 *   The Movie Database image response.
 * @property {ReadonlyArray<Readonly<TmdbImage>>} backdrops
 *   Backdrops.
 * @property {number} id
 *   ID.
 * @property {ReadonlyArray<Readonly<TmdbImage>>} logos
 *   Logos.
 * @property {ReadonlyArray<Readonly<TmdbImage>>} posters
 *   Posters.
 *
 * @typedef TraktEpisode
 *   Trakt episode.
 * @property {Readonly<TraktIds>} ids
 *   Episodes.
 * @property {number} number
 *   Number.
 * @property {number} season
 *   Season.
 * @property {string} title
 *   Title.
 *
 * @typedef {TraktHistoryEpisode | TraktHistoryMovie} TraktHistoryEntry
 *   Trakt history entry.
 *
 * @typedef TraktHistoryEpisode
 *   Trakt history episode.
 * @property {unknown} action
 *   Action.
 * @property {Readonly<TraktEpisode>} episode
 *   Episode.
 * @property {number} id
 *   ID.
 * @property {Readonly<TraktShow>} show
 *   Show.
 * @property {'episode'} type
 *   Type.
 * @property {string} watched_at
 *   Watched at.
 *
 * @typedef TraktHistoryMovie
 *   Trakt history movie.
 * @property {unknown} action
 *   Action.
 * @property {number} id
 *   ID.
 * @property {Readonly<TraktMovie>} movie
 *   Movie.
 * @property {'movie'} type
 *   Type.
 * @property {string} watched_at
 *   Watched at.
 *
 * @typedef TraktIds
 *   Trakt IDs.
 * @property {string} imdb
 *   IMDB ID.
 * @property {string | undefined} [slug]
 *   Slug.
 * @property {number} tmdb
 *   The Movie Database ID.
 * @property {number} trakt
 *   Trakt ID.
 * @property {number | null} tvdb
 *   The TV Database ID.
 * @property {number | null} tvrage
 *   TVRage ID.
 *
 * @typedef TraktMovie
 *   Trakt movie;
 *   note: might include more fields.
 * @property {Readonly<TraktIds>} ids
 *   IDs.
 * @property {string} title
 *   Title.
 * @property {number} year
 *   Year.
 *
 * @typedef TraktRatingEpisode
 *   Trakt rating.
 * @property {Readonly<TraktEpisode>} episode
 *   Episode.
 * @property {string} rated_at
 *   Date.
 * @property {number} rating
 *   Rating.
 * @property {'episode'} type
 *   Type.
 *
 * @typedef TraktRatingMovie
 *   Trakt rating.
 * @property {Readonly<TraktMovie>} movie
 *   Movie.
 * @property {string} rated_at
 *   Date.
 * @property {number} rating
 *   Rating.
 * @property {'movie'} type
 *   Type.
 *
 * @typedef TraktRatingShow
 *   Trakt rating.
 * @property {string} rated_at
 *   Date.
 * @property {number} rating
 *   Rating.
 * @property {Readonly<TraktShow>} show
 *   Show.
 * @property {'show'} type
 *   Type.
 *
 * @typedef {TraktRatingEpisode | TraktRatingMovie | TraktRatingShow} TraktRating
 *   Trakt rating.
 *
 * @typedef TraktShow
 *   Trakt show.
 * @property {Readonly<TraktIds>} ids
 *   IDs.
 * @property {string} title
 *   Title.
 * @property {number} year
 *   Year.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import all from 'p-all'
import {fetch} from 'undici'

dotenv.config()

const tmdbKey = process.env.TMDB_TOKEN
const ttvKey = process.env.TTV_TOKEN
const ttvUser = process.env.TTV_USER

if (!tmdbKey) throw new Error('Missing `TMDB_TOKEN`')
if (!ttvKey) throw new Error('Missing `TTV_TOKEN`')
if (!ttvUser) throw new Error('Missing `TTV_USER`')

const outUrl = new URL('../data/shows.json', import.meta.url)

// Order-sensitive.
const languages = ['en', 'nl', 'fr', 'de', 'it', 'es']

const ratingsResponse = await fetch(
  'https://api.trakt.tv/users/' + ttvUser + '/ratings?limit=300',
  {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-key': ttvKey,
      'trakt-api-version': '2'
    }
  }
)
const ratingsBody = /** @type {ReadonlyArray<Readonly<TraktRating>>} */ (
  await ratingsResponse.json()
)

/** @type {Map<number, number>} */
const ratings = new Map()

for (const d of ratingsBody) {
  if (d.type === 'episode') continue

  ratings.set(d.type === 'movie' ? d.movie.ids.tmdb : d.show.ids.tmdb, d.rating)
}

const response = await fetch(
  'https://api.trakt.tv/users/' + ttvUser + '/history?limit=300',
  {
    headers: {
      'Content-Type': 'application/json',
      'trakt-api-key': ttvKey,
      'trakt-api-version': '2'
    }
  }
)
const body = /** @type {ReadonlyArray<Readonly<TraktHistoryEntry>>} */ (
  await response.json()
)

/** @type {ReadonlyArray<Readonly<ThingRaw>>} */
const flat = body.map(function (d) {
  if (d.type === 'movie') {
    return {
      last: new Date(d.watched_at),
      rating: ratings.get(d.movie.ids.tmdb),
      title: d.movie.title,
      tmdbId: d.movie.ids.tmdb,
      type: d.type,
      year: d.movie.year
    }
  }

  // Ignore info on the episode, just take the show.
  return {
    last: new Date(d.watched_at),
    rating: ratings.get(d.show.ids.tmdb),
    title: d.show.title,
    tmdbId: d.show.ids.tmdb,
    type: 'show',
    year: d.show.year
  }
})

/** @type {Map<number, Readonly<ThingRaw>>} */
const byId = new Map()
let index = -1

while (++index < flat.length) {
  const id = flat[index].tmdbId
  if (!byId.has(id)) {
    byId.set(id, flat[index])
  }
}

const items = [...byId.values()].sort(sort)

const data = await all(
  items.map(function (d) {
    return function () {
      return getImage(d)
    }
  }),
  {concurrency: 2}
)

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(data, undefined, 2) + '\n')

/**
 * @param {Readonly<ThingRaw>} a
 *   Left.
 * @param {Readonly<ThingRaw>} b
 *   Right.
 * @returns {number}
 *   Sort value.
 */
function sort(a, b) {
  return score(b).valueOf() - score(a).valueOf()
}

/**
 * @param {Readonly<ThingRaw>} d
 *   Thing.
 * @returns {Readonly<Date>}
 *   Score.
 */
function score(d) {
  return d.last
}

/**
 * @param {Readonly<ThingRaw>} d
 *   Thing.
 * @returns {Promise<Thing>}
 *   Thing.
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

    const posters = [...body.posters].sort(function (a, b) {
      return b.vote_average - a.vote_average
    })
    let image = posters[0]

    languages.some(function (l) {
      const poster = posters.find(function (d) {
        return d.iso_639_1 === l
      })
      if (poster) image = poster
      return Boolean(poster)
    })

    copy.image = {
      height: image.height,
      url: 'https://image.tmdb.org/t/p/w780' + image.file_path,
      width: image.width
    }
  } catch {
    console.warn('Could not get image for:', d.title)
  }

  return copy
}
