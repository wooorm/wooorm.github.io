import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

var key = process.env.OC_TOKEN
var ghKey = process.env.GH_TOKEN

if (!key) throw new Error('Missing `OC_TOKEN`')
if (!ghKey) throw new Error('Missing `GH_TOKEN`')

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

Promise.all([
  fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({query, variables}),
    headers: {'Content-Type': 'application/json', 'Api-Key': key}
  }).then((response) => response.json()),
  fetch(
    'https://raw.githubusercontent.com/unifiedjs/unifiedjs.github.io/main/crawl/sponsors.txt',
    {headers: {Authorization: 'bearer ' + ghKey}}
  ).then((response) => response.text())
])
  .then(function ([result, sponsorsText]) {
    var control = sponsorsText
      .split('\n')
      .filter(Boolean)
      .map((d) => {
        var spam = d.charAt(0) === '-'
        return {oc: spam ? d.slice(1) : d, spam}
      })
    var seen = []
    var members = result.data.collective.members.nodes
      .map((d) => {
        var oc = d.account.slug
        var github = d.account.githubHandle || undefined
        var twitter = d.account.twitterHandle || undefined
        var url = d.account.website || undefined
        var info = control.find((d) => d.oc === oc)

        if (url === ghBase + github || url === twBase + twitter) {
          url = undefined
        }

        if (!info) {
          console.log(
            ' @%s is an unknown sponsor, please define whether it’s spam or not in `sponsors.txt` in the `unifiedjs/unifiedjs.github.io` repo',
            oc
          )
        }

        return {
          spam: !info || info.spam,
          name: d.account.name,
          description: d.account.description || undefined,
          image: d.account.imageUrl,
          oc,
          github,
          twitter,
          url,
          gold:
            (d.tier && d.tier.name && /gold/i.test(d.tier.name)) || undefined,
          amount: d.totalDonations.value
        }
      })
      .filter((d) => {
        var ignore = d.spam || seen.includes(d.oc) // Ignore dupes in data.
        seen.push(d.oc)
        return d.amount > min && !ignore
      })
      .sort(sort)
      .map((d) => Object.assign(d, {amount: undefined, spam: undefined}))

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
