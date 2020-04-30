var fs = require('fs')
var path = require('path')
var fetch = require('node-fetch')

require('dotenv').config()

var key = process.env.OC_TOKEN

if (!key) throw new Error('Missing `OC_TOKEN`')

var outpath = path.join('data', 'opencollective.json')
var min = 5

var endpoint = 'https://api.opencollective.com/graphql/v2'

var variables = {slug: 'unified'}

var ghBase = 'https://github.com/'
var twBase = 'https://twitter.com/'

var query = `query($slug: String) {
  collective(slug: $slug) {
    members(limit: 100, role: BACKER) {
      nodes {
        totalDonations { value }
        tier { name }
        account {
          id
          slug
          name
          description
          website
          twitterHandle
          githubHandle
          imageUrl
        }
      }
    }
  }
}
`

fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify({query: query, variables: variables}),
  headers: {'Content-Type': 'application/json', 'Api-Key': key}
})
  .then((response) => response.json())
  .then(function (result) {
    var seen = []
    var members = result.data.collective.members.nodes
      .map((d) => {
        var github = d.account.githubHandle || undefined
        var twitter = d.account.twitterHandle || undefined
        var url = d.account.website || undefined

        if (url === ghBase + github || url === twBase + twitter) {
          url = undefined
        }

        return {
          name: d.account.name,
          description: d.account.description || undefined,
          image: d.account.imageUrl,
          oc: d.account.slug,
          github,
          twitter,
          url,
          gold:
            (d.tier && d.tier.name && /gold/i.test(d.tier.name)) || undefined,
          amount: d.totalDonations.value
        }
      })
      .filter((d) => {
        var ignore = seen.includes(d.oc) // Ignore dupes in data.
        seen.push(d.oc)
        return d.amount > min && !ignore
      })
      .sort(sort)
      .map((d) => Object.assign(d, {amount: undefined}))

    return fs.promises
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.promises.writeFile(outpath, JSON.stringify(members, null, 2) + '\n')
      )
  })
  .catch(() => {
    throw new Error('Could not get OC')
  })

function sort(a, b) {
  return b.amount - a.amount
}
