var fs = require('fs')
var path = require('path')
var fetch = require('node-fetch')

require('dotenv').config()

var key = process.env.GH_TOKEN

if (!key) throw new Error('Missing `GH_TOKEN`')

var outpath = path.join('data', 'github-sponsors.json')

var endpoint = 'https://api.github.com/graphql'

var query = `query {
  viewer {
    sponsorshipsAsMaintainer(first: 100) {
      nodes {
        sponsor {
          login
          name
          bio
          avatarUrl
          websiteUrl
        }
        tier { monthlyPriceInDollars }
      }
    }
  }
}
`

fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify({query: query}),
  headers: {'Content-Type': 'application/json', Authorization: 'bearer ' + key}
})
  .then((response) => response.json())
  .then(function (result) {
    var data = result.data.viewer.sponsorshipsAsMaintainer.nodes.map(map)

    return fs.promises.writeFile(outpath, JSON.stringify(data, null, 2) + '\n')

    function map(d) {
      var tier = d.tier.monthlyPriceInDollars
      return {
        github: d.sponsor.login,
        name: d.sponsor.name,
        description: d.sponsor.bio,
        image: d.sponsor.avatarUrl,
        url: d.sponsor.websiteUrl,
        gold: tier >= 50 || undefined
      }
    }
  })
  .catch((_) => {
    console.error('Could not get sponsors')
  })
