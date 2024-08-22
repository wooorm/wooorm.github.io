/***
 * @typedef Album
 *   Album.
 * @property {string} artist
 *   Artist.
 * @property {number} count
 *   Plays.
 * @property {string} image
 *   Image.
 * @property {string} name
 *   Name.
 *
 * @typedef {{'#text': string, url: string}} LastfmImage
 *   Last.fm image;
 *   Note: has to be typed like this to allow `#text`.
 *
 * @typedef LastfmArtist
 *   Last.fm artist.
 * @property {string} mbid
 *   MusicBrainz ID.
 * @property {string} name
 *   Name.
 * @property {string} url
 *   URL.
 *
 * @typedef LastfmAlbum
 *   Last.fm album.
 * @property {LastfmArtist} artist
 *   Artist.
 * @property {ReadonlyArray<Readonly<LastfmImage>>} image
 *   Images.
 * @property {string} mbid
 *   MusicBrainz ID.
 * @property {string} name
 *   Name.
 * @property {string} playcount
 *   Plays.
 * @property {string} url
 *   URL.
 *
 * @typedef LastfmTopAlbumResponse
 *   Last.fm top album response.
 * @property {{album: ReadonlyArray<Readonly<LastfmAlbum>>}} topalbums
 *   Top albums.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import {fetch} from 'undici'

dotenv.config()

const key = process.env.LFM_TOKEN
const user = process.env.LFM_USER

if (!key) throw new Error('Missing `LFM_TOKEN`')
if (!user) throw new Error('Missing `LFM_USER`')

const outUrl = new URL('../data/albums.json', import.meta.url)

const url = new URL('http://ws.audioscrobbler.com/2.0/')
url.searchParams.append('api_key', key)
url.searchParams.append('format', 'json')
url.searchParams.append('limit', '60')
url.searchParams.append('method', 'user.gettopalbums')
url.searchParams.append('period', '1month')
url.searchParams.append('user', user)

const response = await fetch(url.href)
const body = /** @type {Readonly<LastfmTopAlbumResponse>} */ (
  await response.json()
)

const albums = body.topalbums.album.flatMap(function (d) {
  const image = d.image
    .map(function (d) {
      const text = d['#text']
      return text
    })
    .findLast(Boolean)

  if (image) {
    /** @type {Readonly<Album>} */
    const result = {
      artist: d.artist.name,
      count: Number.parseInt(d.playcount, 10),
      image,
      name: d.name
    }

    return result
  }

  return []
})

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(albums, undefined, 2) + '\n')
