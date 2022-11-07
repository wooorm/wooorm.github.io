/**
 * @typedef Artist
 * @property {string} name
 * @property {SpotifyImage} image
 *
 * @typedef SpotifyTokenData
 * @property {string} access_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {string} scope
 *
 * @typedef SpotifyImage
 * @property {number} height
 * @property {string} url
 * @property {number} width
 *
 * @typedef SpotifyTopArtist
 * @property {Record<string, string>} external_urls
 * @property {{href: null, total: number}} followers
 * @property {Array<string>} genres
 * @property {string} href
 * @property {string} id
 * @property {Array<SpotifyImage>} images
 * @property {string} name
 * @property {number} popularity
 * @property {'artist'} type
 * @property {string} uri
 *
 * @typedef SpotifyTopArtistsResponse
 * @property {Array<SpotifyTopArtist>} items
 * @property {number} total
 * @property {number} limit
 * @property {number} offset
 * @property {string} href
 * @property {string|null} previous
 * @property {string|null} next
 */

import {Buffer} from 'node:buffer'
import fs from 'node:fs/promises'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ref = process.env.SPOT_R_TOKEN
const cId = process.env.SPOT_C_ID
const cSecret = process.env.SPOT_C_SECRET

if (!ref) throw new Error('Missing `SPOT_R_TOKEN`')
if (!cId) throw new Error('Missing `SPOT_C_ID`')
if (!cSecret) throw new Error('Missing `SPOT_C_SECRET`')

const outUrl = new URL('../data/artists.json', import.meta.url)

const parameters = new URLSearchParams()
parameters.append('grant_type', 'refresh_token')
parameters.append('refresh_token', ref)

// Get token.
const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    Authorization:
      'Basic ' + Buffer.from(cId + ':' + cSecret).toString('base64')
  },
  body: parameters
})
const tokenData = /** @type {SpotifyTokenData} */ (await tokenResponse.json())

const response = await fetch('https://api.spotify.com/v1/me/top/artists', {
  headers: {Authorization: 'Bearer ' + tokenData.access_token}
})

const body = /** @type {SpotifyTopArtistsResponse} */ (await response.json())

const artists = body.items.map((d) => {
  /** @type {Artist} */
  const result = {name: d.name, image: d.images[0]}
  return result
})

await fs.mkdir(new URL('../', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(artists, null, 2) + '\n')
