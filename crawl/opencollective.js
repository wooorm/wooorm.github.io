/**
 * @typedef OcAccount
 *   Open Collective account.
 * @property {string | null} description
 *   Description.
 * @property {string | null} githubHandle
 *   GitHub username.
 * @property {string} id
 *   ID.
 * @property {string} imageUrl
 *   Image URL.
 * @property {string} name
 *   Name.
 * @property {string} slug
 *   Slug.
 * @property {string | null} website
 *   Website.
 *
 * @typedef OcCollective
 *   Open Collective collective.
 * @property {{nodes: ReadonlyArray<Readonly<OcMember>>}} members
 *   Members.
 *
 * @typedef OcData
 *   Open Collective data.
 * @property {Readonly<OcCollective>} collective
 *   Collective.
 *
 * @typedef OcMember
 *   Open Collective member.
 * @property {Readonly<OcAccount>} account
 *   Account.
 * @property {Readonly<{value: number}>} totalDonations
 *   Total donations.
 *
 * @typedef OcResponse
 *   Open Collective response.
 * @property {Readonly<OcData>} data
 *   Data.
 *
 * @typedef {Omit<SponsorRaw, 'spam' | 'total'>} Sponsor
 *   Sponsor.
 *
 * @typedef SponsorRaw
 *   Sponsor (raw).
 * @property {string | undefined} description
 *   Description.
 * @property {string | undefined} github
 *   GitHub username.
 * @property {string} image
 *   Image.
 * @property {string} name
 *   Name.
 * @property {string} oc
 *   Open Collective slug.
 * @property {boolean} spam
 *   Whether it’s spam.
 * @property {number} total
 *   Total donations.
 * @property {string | undefined} url
 *   URL.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import {fetch} from 'undici'

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

const query = `query($slug: String) {
  collective(slug: $slug) {
    members(limit: 100, role: BACKER) {
      nodes {
        totalDonations { value }
        account {
          description
          githubHandle
          id
          imageUrl
          name
          slug
          website
        }
      }
    }
  }
}
`

const collectiveResponse = await fetch(endpoint, {
  body: JSON.stringify({query, variables}),
  headers: {'Content-Type': 'application/json', 'Api-Key': key},
  method: 'POST'
})
const collectiveBody = /** @type {Readonly<OcResponse>} */ (
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
  .map(function (d) {
    const spam = d.charAt(0) === '-'
    return {oc: spam ? d.slice(1) : d, spam}
  })

/** @type {Set<string>} */
const seen = new Set()
const members = collectiveBody.data.collective.members.nodes
  .map(function (d) {
    const oc = d.account.slug
    const github = d.account.githubHandle || undefined
    let url = d.account.website || undefined
    const info = control.find(function (d) {
      return d.oc === oc
    })

    if (url === ghBase + github) {
      url = undefined
    }

    if (!info) {
      console.error(
        ' @%s is an unknown sponsor, please define whether it’s spam or not in `sponsors.txt` in the `unifiedjs/unifiedjs.github.io` repo',
        oc
      )
    }

    /** @type {Readonly<SponsorRaw>} */
    const result = {
      description: d.account.description || undefined,
      github,
      image: d.account.imageUrl,
      name: d.account.name,
      oc,
      spam: !info || info.spam,
      total: d.totalDonations.value,
      url
    }

    return result
  })
  .filter(function (d) {
    const ignore = d.spam || seen.has(d.oc) // Ignore dupes in data.
    seen.add(d.oc)
    return d.total > min && !ignore
  })
  .sort(sort)
  .map(function (d) {
    return strip(d)
  })

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(members, undefined, 2) + '\n')

/**
 * @param {Readonly<SponsorRaw>} d
 *   Sponsor (raw).
 * @returns {Sponsor}
 *   Sponsor.
 */
function strip(d) {
  const {spam, total, ...rest} = d
  return rest
}

/**
 * @param {Readonly<SponsorRaw>} a
 *   Left.
 * @param {Readonly<SponsorRaw>} b
 *   Right.
 * @returns {number}
 *   Sort value.
 */
function sort(a, b) {
  return b.total - a.total
}
