/***
 * @typedef Album
 * @property {string} name
 * @property {string} artist
 * @property {string} image
 * @property {number} count
 *
 * @typedef LastfmImage
 * @property {string} url
 *
 * @typedef LastfmArtist
 * @property {string} url
 * @property {string} name
 * @property {string} mbid
 *
 * @typedef LastfmAlbum
 * @property {LastfmArtist} artist
 * @property {Array<LastfmImage>} image
 * @property {string} mbid
 * @property {string} url
 * @property {string} playcount
 * @property {string} name
 *
 * @typedef LastfmTopAlbumResponse
 * @property {{album: Array<LastfmAlbum>}} topalbums
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const key = process.env.LFM_TOKEN
const user = process.env.LFM_USER

if (!key) throw new Error('Missing `LFM_TOKEN`')
if (!user) throw new Error('Missing `LFM_USER`')

const outUrl = new URL('../data/albums.json', import.meta.url)

const url = new URL('http://ws.audioscrobbler.com/2.0/')
url.searchParams.append('method', 'user.gettopalbums')
url.searchParams.append('user', user)
url.searchParams.append('api_key', key)
url.searchParams.append('format', 'json')
url.searchParams.append('period', '1month')
url.searchParams.append('limit', '60')

const response = await fetch(url.href)
const body = /** @type {LastfmTopAlbumResponse} */ (await response.json())

const albums = body.topalbums.album.flatMap((d) => {
  const image = d.image
    .map((d) => {
      /** @type {string} */
      // @ts-expect-error: can’t be typed, but it exists
      const text = d['#text']
      return text
    })
    .filter(Boolean)
    .pop()

  if (image) {
    /** @type {Album} */
    const result = {
      name: d.name,
      artist: d.artist.name,
      image,
      count: Number.parseInt(d.playcount, 10)
    }

    return result
  }

  return []
})

await fs.mkdir(new URL('../', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(albums, null, 2) + '\n')
