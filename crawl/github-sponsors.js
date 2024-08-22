/**
 * @typedef GithubOrganizationData
 *   Github organization data.
 * @property {{nodes: ReadonlyArray<Readonly<GithubSponsorNode>>}} lifetimeReceivedSponsorshipValues
 *   Sponsorships.
 *
 * @typedef GithubSponsor
 *   GitHub sponsor.
 * @property {string} avatarUrl
 *   Avatar URL.
 * @property {string | null | undefined} [bio]
 *   Bio.
 * @property {string | null | undefined} [description]
 *   Description.
 * @property {string} login
 *   Username.
 * @property {string | null} name
 *   Name.
 * @property {string | null} websiteUrl
 *   URL.
 *
 * @typedef GithubSponsorNode
 *   GitHub sponsor node.
 * @property {number} amountInCents
 *   Total price.
 * @property {Readonly<GithubSponsor>} sponsor
 *   Sponsor.
 *
 * @typedef GithubSponsorsResponse
 *   GitHub sponsors response.
 * @property {{organization: Readonly<GithubOrganizationData>, viewer: Readonly<GithubViewerData>}} data
 *   Data.
 *
 * @typedef GithubViewerData
 *   GitHub viewer data.
 * @property {{nodes: ReadonlyArray<Readonly<GithubSponsorNode>>}} lifetimeReceivedSponsorshipValues
 *   Sponsorships.
 *
 * @typedef {Omit<SponsorRaw, 'total'>} Sponsor
 *   Sponsor.
 *
 * @typedef SponsorRaw
 *   Sponsor (raw).
 * @property {string | undefined} description
 *   Description.
 * @property {string} github
 *   GitHub username.
 * @property {string} image
 *   Image.
 * @property {string | undefined} name
 *   Name.
 * @property {number} total
 *   Total amount.
 * @property {string | undefined} url
 *   URL.
 *
 * @typedef Sponsors
 *   Sponsors.
 * @property {ReadonlyArray<Readonly<Sponsor>>} collective
 *   Collective sponsors.
 * @property {ReadonlyArray<Readonly<Sponsor>>} personal
 *   Personal sponsors.
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import {fetch} from 'undici'

dotenv.config()

const key = process.env.GH_TOKEN

if (!key) throw new Error('Missing `GH_TOKEN`')

const outUrl = new URL('../data/github-sponsors.json', import.meta.url)

const endpoint = 'https://api.github.com/graphql'

const query = `query($org: String!) {
  organization(login: $org) {
    lifetimeReceivedSponsorshipValues(first: 100, orderBy: {field: LIFETIME_VALUE, direction: DESC}) {
      nodes {
        amountInCents
        sponsor {
          ... on Organization { avatarUrl description login name websiteUrl }
          ... on User { avatarUrl bio login name websiteUrl }
        }
      }
    }
  }
  viewer {
    lifetimeReceivedSponsorshipValues(first: 100, orderBy: {field: LIFETIME_VALUE, direction: DESC}) {
      nodes {
        amountInCents
        sponsor {
          ... on Organization { avatarUrl description login name websiteUrl }
          ... on User { avatarUrl bio login name websiteUrl }
        }
      }
    }
  }
}
`

const response = await fetch(endpoint, {
  body: JSON.stringify({query, variables: {org: 'unifiedjs'}}),
  headers: {Authorization: 'bearer ' + key, 'Content-Type': 'application/json'},
  method: 'POST'
})
const body = /** @type {Readonly<GithubSponsorsResponse>} */ (
  await response.json()
)

const collective =
  body.data.organization.lifetimeReceivedSponsorshipValues.nodes
    .map(function (d) {
      return clean(d)
    })
    .sort(sort)
    .map(function (d) {
      return strip(d)
    })
const personal = body.data.viewer.lifetimeReceivedSponsorshipValues.nodes
  .map(function (d) {
    return clean(d)
  })
  .sort(sort)
  .map(function (d) {
    return strip(d)
  })

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(
  outUrl,
  JSON.stringify({collective, personal}, undefined, 2) + '\n'
)

/**
 * @param {Readonly<GithubSponsorNode>} d
 *   Sponsor node.
 * @returns {SponsorRaw}
 *   Sponsor.
 */
function clean(d) {
  return {
    description: d.sponsor.bio || d.sponsor.description || undefined,
    github: d.sponsor.login,
    image: d.sponsor.avatarUrl,
    name: d.sponsor.name || undefined,
    total: Math.floor(d.amountInCents / 100),
    url: d.sponsor.websiteUrl || undefined
  }
}

/**
 * @param {Readonly<SponsorRaw>} d
 *   Sponsor.
 * @returns {Sponsor}
 *   Sponsor.
 */
function strip(d) {
  const {total, ...rest} = d
  return rest
}

/**
 * @param {Readonly<SponsorRaw>} a
 *   Left.
 * @param {Readonly<SponsorRaw>} b
 *   Right.
 * @returns {number}
 *   Sort order.
 */
function sort(a, b) {
  return b.total - a.total
}
