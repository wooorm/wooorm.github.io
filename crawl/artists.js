import {Buffer} from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ref = process.env.SPOT_R_TOKEN
const cId = process.env.SPOT_C_ID
const cSecret = process.env.SPOT_C_SECRET

if (!ref) throw new Error('Missing `SPOT_R_TOKEN`')
if (!cId) throw new Error('Missing `SPOT_C_ID`')
if (!cSecret) throw new Error('Missing `SPOT_C_SECRET`')

const URLSearchParameters = url.URLSearchParams

const outpath = path.join('data', 'artists.json')

const parameters = new URLSearchParameters()
parameters.append('grant_type', 'refresh_token')
parameters.append('refresh_token', ref)

// Get token.
fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    Authorization:
      'Basic ' + Buffer.from(cId + ':' + cSecret).toString('base64')
  },
  body: parameters
})
  .then((response) => response.json())
  // Get top artists.
  .then((data) =>
    fetch('https://api.spotify.com/v1/me/top/artists', {
      headers: {Authorization: 'Bearer ' + data.access_token}
    })
  )
  .then((response) => response.json())
  .then((body) => {
    const artists = body.items.map((d) => ({name: d.name, image: d.images[0]}))

    return fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(artists, null, 2) + '\n')
      )
  })
  .catch(() => {
    throw new Error('Could not get artists')
  })
