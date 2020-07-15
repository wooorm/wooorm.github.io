var url = require('url')
var fs = require('fs')
var path = require('path')
var fetch = require('node-fetch')

require('dotenv').config()

var ref = process.env.SPOT_R_TOKEN
var cId = process.env.SPOT_C_ID
var cSecret = process.env.SPOT_C_SECRET

if (!ref) throw new Error('Missing `SPOT_R_TOKEN`')
if (!cId) throw new Error('Missing `SPOT_C_ID`')
if (!cSecret) throw new Error('Missing `SPOT_C_SECRET`')

var URLSearchParameters = url.URLSearchParams

var outpath = path.join('data', 'artists.json')

var parameters = new URLSearchParameters()
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
  .then((data) => {
    return fetch('https://api.spotify.com/v1/me/top/artists', {
      headers: {Authorization: 'Bearer ' + data.access_token}
    })
  })
  .then((response) => response.json())
  .then(function (body) {
    var artists = body.items.map(artist)

    return fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(artists, null, 2) + '\n')
      )

    function artist(d) {
      var {name, images} = d
      var image = images[0]
      return {name, image}
    }
  })
  .catch(() => {
    throw new Error('Could not get artists')
  })
