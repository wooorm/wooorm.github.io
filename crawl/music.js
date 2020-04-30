var fs = require('fs')
var path = require('path')
var fetch = require('node-fetch')

require('dotenv').config()

var key = process.env.LFM_TOKEN
var user = process.env.LFM_USER

if (!key) throw new Error('Missing `LFM_TOKEN`')
if (!user) throw new Error('Missing `LFM_USER`')

fetch(
  'http://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=' +
    user +
    '&api_key=' +
    key +
    '&format=json&period=1month&limit=60'
)
  .then((response) => response.json())
  .then(function (body) {
    var albums = body.topalbums.album.flatMap(album)

    fs.writeFileSync(
      path.join('data', 'music.json'),
      JSON.stringify(albums, null, 2) + '\n'
    )

    function album(d) {
      var artist = d.artist.name
      var image = d.image
        .map((d) => d['#text'])
        .filter(Boolean)
        .pop()
      var count = parseInt(d.playcount, 10)
      var name = d.name
      return image ? {name, artist, image, count} : []
    }
  })
  .catch(() => {
    console.error('Could not get albums')
  })
