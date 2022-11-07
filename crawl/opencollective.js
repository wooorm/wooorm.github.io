/**
 * @typedef {Omit<SponsorRaw, 'spam' | 'total'>} Sponsor
 *
 * @typedef SponsorRaw
 * @property {boolean} spam
 * @property {string} name
 * @property {string|undefined} description
 * @property {string} image
 * @property {string} oc
 * @property {string|undefined} github
 * @property {string|undefined} twitter
 * @property {string|undefined} url
 * @property {number} total
 *
 * @typedef OcAccount
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string|null} description
 * @property {string|null} website
 * @property {string|null} twitterHandle
 * @property {string|null} githubHandle
 * @property {string} imageUrl
 *
 * @typedef OcMember
 * @property {{value: number}} totalDonations
 * @property {OcAccount} account
 *
 * @typedef OcCollective
 * @property {{nodes: Array<OcMember>}} members
 *
 * @typedef OcData
 * @property {OcCollective} collective
 *
 * @typedef OcResponse
 * @property {OcData} data
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const key = process.env.OC_TOKEN
const ghKey = process.env.GH_TOKEN

if (!key) throw new Error('Missing `OC_TOKEN`')
if (!ghKey) throw new Error('Missing `GH_TOKEN`')

const outUrl = new URL('../data/opencollective.json', import.meta.url)
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

const collectiveResponse = await fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify({query, variables}),
  headers: {'Content-Type': 'application/json', 'Api-Key': key}
})
const collectiveBody = /** @type {OcResponse} */ (
  await collectiveResponse.json()
)

const githubResponse = await fetch(
  'https://raw.githubusercontent.com/unifiedjs/unifiedjs.github.io/main/crawl/sponsors.txt',
  {headers: {Authorization: 'bearer ' + ghKey}}
)
const githubBody = await githubResponse.text()

const control = githubBody
  .split('\n')
  .filter(Boolean)
  .map((d) => {
    const spam = d.charAt(0) === '-'
    return {oc: spam ? d.slice(1) : d, spam}
  })

/** @type {Array<string>} */
const seen = []
const members = collectiveBody.data.collective.members.nodes
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
      console.error(
        ' @%s is an unknown sponsor, please define whether it’s spam or not in `sponsors.txt` in the `unifiedjs/unifiedjs.github.io` repo',
        oc
      )
    }

    /** @type {SponsorRaw} */
    const result = {
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

    return result
  })
  .filter((d) => {
    const ignore = d.spam || seen.includes(d.oc) // Ignore dupes in data.
    seen.push(d.oc)
    return d.total > min && !ignore
  })
  .sort(sort)
  .map((d) => strip(d))

await fs.mkdir(new URL('../', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(members, null, 2) + '\n')

/**
 * @param {SponsorRaw} d
 * @returns {Sponsor}
 */
function strip(d) {
  return Object.assign(d, {total: undefined, spam: undefined})
}

/**
 * @param {SponsorRaw} a
 * @param {SponsorRaw} b
 */
function sort(a, b) {
  return b.total - a.total
}
