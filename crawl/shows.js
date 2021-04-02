import fs from 'fs'
import path from 'path'
import all from 'p-all'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

var ttvKey = process.env.TTV_TOKEN
var user = process.env.TTV_USER
var tmdbKey = process.env.TMDB_TOKEN

if (!ttvKey) throw new Error('Missing `TTV_TOKEN`')
if (!user) throw new Error('Missing `TTV_USER`')
if (!tmdbKey) throw new Error('Missing `TMDB_TOKEN`')

var outpath = path.join('data', 'shows.json')

fetch('https://api.trakt.tv/users/' + user + '/history?limit=300', {
  headers: {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': ttvKey
  }
})
  .then((response) => response.json())
  .then(async function (body) {
    var flat = body.flatMap(function (d) {
      var type = d.type === 'movie' ? 'movie' : 'show'
      return {
        title: d[type].title,
        type,
        year: d[type].year,
        last: new Date(d.watched_at),
        tmdbId: d[type].ids.tmdb
      }
    })
    var byId = {}
    var index = -1

    while (++index < flat.length) {
      if (!(flat[index].tmdbId in byId)) {
        byId[flat[index].tmdbId] = flat[index]
      }
    }

    var items = Object.values(byId).sort(sort)

    var data = await all(
      items.map((d) => () => getImage(d)),
      {concurrency: 2}
    )

    await fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(data, null, 2) + '\n')
      )

    async function getImage(d) {
      var endpoint
      var response
      var body
      var posters
      var image

      try {
        endpoint =
          'https://api.themoviedb.org/3/' +
          (d.type === 'show' ? 'tv' : d.type) +
          '/' +
          d.tmdbId +
          '/images'

        response = await fetch(endpoint + '?api_key=' + tmdbKey, {
          headers: {'Content-Type': 'application/json'}
        })
        body = await response.json()
        posters = body.posters.sort((a, b) => b.vote_average - a.vote_average)
        image =
          posters.find((d) => d.iso_639_1 === 'en') ||
          posters.find((d) => d.iso_639_1 === 'nl') ||
          posters[0]

        d.image = {
          width: image.width,
          height: image.height,
          url: 'https://image.tmdb.org/t/p/w300' + image.file_path
        }
      } catch {
        console.warn('Could not get image for:', d.title)
      }

      return d
    }

    function sort(a, b) {
      return score(b) - score(a)
    }

    function score(d) {
      return d.last
    }
  })
  .catch(() => {
    throw new Error('Could not get shows')
  })
