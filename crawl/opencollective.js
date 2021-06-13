import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const key = process.env.OC_TOKEN
const ghKey = process.env.GH_TOKEN

if (!key) throw new Error('Missing `OC_TOKEN`')
if (!ghKey) throw new Error('Missing `GH_TOKEN`')

const outpath = path.join('data', 'opencollective.json')
const min = 5

const endpoint = 'https://api.opencollective.com/graphql/v2'

const variables = {slug: 'unified'}

const ghBase = 'https://github.com/'
const twBase = 'https://twitter.com/'

const query = `query($slug: String) {
  collective(slug: $slug) {
    members(limit: 100, role: BACKER) {
      nodes {
        totalDonations { value }
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
  .then(([result, sponsorsText]) => {
    const control = sponsorsText
      .split('\n')
      .filter(Boolean)
      .map((d) => {
        const spam = d.charAt(0) === '-'
        return {oc: spam ? d.slice(1) : d, spam}
      })
    const seen = []
    const members = result.data.collective.members.nodes
      .map((d) => {
        const oc = d.account.slug
        const github = d.account.githubHandle || undefined
        const twitter = d.account.twitterHandle || undefined
        let url = d.account.website || undefined
        const info = control.find((d) => d.oc === oc)

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
          total: d.totalDonations.value
        }
      })
      .filter((d) => {
        const ignore = d.spam || seen.includes(d.oc) // Ignore dupes in data.
        seen.push(d.oc)
        return d.total > min && !ignore
      })
      .sort(sort)
      .map((d) => Object.assign(d, {total: undefined, spam: undefined}))

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
  return b.total - a.total
}
