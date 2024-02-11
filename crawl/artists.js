/**
 * @typedef Artist
 *   Artist.
 * @property {SpotifyImage} image
 *   Image.
 * @property {string} name
 *   Name.
 *
 * @typedef SpotifyFollowers
 *   Spotify followers.
 * @property {string | null} href
 *   URL.
 * @property {number} total
 *   Total.
 *
 * @typedef SpotifyImage
 *   Spotify image.
 * @property {number} height
 *   Height.
 * @property {string} url
 *   URL.
 * @property {number} width
 *   Width.
 *
 * @typedef SpotifyTokenData
 *   Spotify token data.
 * @property {string} access_token
 *   Access token.
 * @property {number} expires_in
 *   Expires in.
 * @property {string} scope
 *   Scope.
 * @property {string} token_type
 *   Token type.
 *
 * @typedef SpotifyTopArtist
 *   Spotify top artist.
 * @property {Readonly<Record<string, string>>} external_urls
 *   External URLs.
 * @property {Readonly<SpotifyFollowers>} followers
 *   Followers.
 * @property {ReadonlyArray<string>} genres
 *   Genres.
 * @property {string} href
 *   URL.
 * @property {string} id
 *   ID.
 * @property {ReadonlyArray<Readonly<SpotifyImage>>} images
 *   Images.
 * @property {string} name
 *   Name.
 * @property {number} popularity
 *   Popularity.
 * @property {'artist'} type
 *   Type.
 * @property {string} uri
 *   URI.
 *
 * @typedef SpotifyTopArtistsResponse
 *   Spotify top artists response.
 * @property {string} href
 *   URL.
 * @property {ReadonlyArray<Readonly<SpotifyTopArtist>>} items
 *   Items.
 * @property {number} limit
 *   Limit.
 * @property {string | null} next
 *   Next page.
 * @property {number} offset
 *   Offset.
 * @property {string | null} previous
 *   Previous page.
 * @property {number} total
 *   Total pages.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import {fetch} from 'undici'

dotenv.config()

const refreshToken = process.env.SPOT_R_TOKEN
const cId = process.env.SPOT_C_ID
const cSecret = process.env.SPOT_C_SECRET

if (!refreshToken) throw new Error('Missing `SPOT_R_TOKEN`')
if (!cId) throw new Error('Missing `SPOT_C_ID`')
if (!cSecret) throw new Error('Missing `SPOT_C_SECRET`')

const outUrl = new URL('../data/artists.json', import.meta.url)

const parameters = new URLSearchParams()
parameters.append('grant_type', 'refresh_token')
parameters.append('refresh_token', refreshToken)

// Get token.
const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
  body: parameters,
  headers: {Authorization: 'Basic ' + btoa(cId + ':' + cSecret)},
  method: 'POST'
})
const tokenData = /** @type {Readonly<SpotifyTokenData>} */ (
  await tokenResponse.json()
)

const response = await fetch('https://api.spotify.com/v1/me/top/artists', {
  headers: {Authorization: 'Bearer ' + tokenData.access_token}
})

const body = /** @type {Readonly<SpotifyTopArtistsResponse>} */ (
  await response.json()
)

const artists = body.items.map(function (d) {
  /** @type {Readonly<Artist>} */
  const result = {image: d.images[0], name: d.name}
  return result
})

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(artists, undefined, 2) + '\n')
