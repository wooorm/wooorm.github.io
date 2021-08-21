import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const key = process.env.LFM_TOKEN
const user = process.env.LFM_USER

if (!key) throw new Error('Missing `LFM_TOKEN`')
if (!user) throw new Error('Missing `LFM_USER`')

const outpath = path.join('data', 'albums.json')

fetch(
  'http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' +
    user +
    '&api_key=' +
    key +
    '&format=json&period=1month&limit=60'
)
  .then((response) => response.json())
  .then((body) => {
    const albums = body.topalbums.album.flatMap((d) => {
      const image = d.image
        .map((d) => d['#text'])
        .filter(Boolean)
        .pop()
      return image
        ? {
            name: d.name,
            artist: d.artist.name,
            image,
            count: Number.parseInt(d.playcount, 10)
          }
        : []
    })

    return fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(albums, null, 2) + '\n')
      )
  })
  .catch(() => {
    throw new Error('Could not get albums')
  })
