/**
 * @typedef GithubOrganizationData
 *   Github organization data.
 * @property {{nodes: ReadonlyArray<Readonly<GithubSponsorNode>>}} sponsorshipsAsMaintainer
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
 * @property {Readonly<GithubSponsor>} sponsorEntity
 *   Sponsor.
 * @property {Readonly<GithubTier>} tier
 *   Tier.
 *
 * @typedef GithubSponsorsResponse
 *   GitHub sponsors response.
 * @property {{organization: Readonly<GithubOrganizationData>, viewer: Readonly<GithubViewerData>}} data
 *   Data.
 *
 * @typedef GithubTier
 *   GitHub tier.
 * @property {number} monthlyPriceInDollars
 *   Monthly price.
 *
 * @typedef GithubViewerData
 *   GitHub viewer data.
 * @property {{nodes: ReadonlyArray<Readonly<GithubSponsorNode>>}} sponsorshipsAsMaintainer
 *   Sponsorships.
 *
 * @typedef {Omit<SponsorRaw, 'monthly'>} Sponsor
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
 * @property {number} monthly
 *   Monthly price.
 * @property {string | undefined} name
 *   Name.
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
import fetch from 'node-fetch'

dotenv.config()

const key = process.env.GH_TOKEN

if (!key) throw new Error('Missing `GH_TOKEN`')

const outUrl = new URL('../data/github-sponsors.json', import.meta.url)

const endpoint = 'https://api.github.com/graphql'

const query = `query($org: String!) {
  organization(login: $org) {
    sponsorshipsAsMaintainer(first: 100) {
      nodes {
        sponsorEntity {
          ... on User { login name bio avatarUrl websiteUrl }
          ... on Organization { login name description avatarUrl websiteUrl }
        }
        tier { monthlyPriceInDollars }
      }
    }
  }
  viewer {
    sponsorshipsAsMaintainer(first: 100) {
      nodes {
        sponsorEntity {
          ... on User { login name bio avatarUrl websiteUrl }
          ... on Organization { login name description avatarUrl websiteUrl }
        }
        tier { monthlyPriceInDollars }
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

const collective = body.data.organization.sponsorshipsAsMaintainer.nodes
  .map(function (d) {
    return clean(d)
  })
  .sort(sort)
  .map(function (d) {
    return strip(d)
  })
const personal = body.data.viewer.sponsorshipsAsMaintainer.nodes
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
    description:
      d.sponsorEntity.bio || d.sponsorEntity.description || undefined,
    github: d.sponsorEntity.login,
    image: d.sponsorEntity.avatarUrl,
    monthly: d.tier.monthlyPriceInDollars,
    name: d.sponsorEntity.name || undefined,
    url: d.sponsorEntity.websiteUrl || undefined
  }
}

/**
 * @param {Readonly<SponsorRaw>} d
 *   Sponsor.
 * @returns {Sponsor}
 *   Sponsor.
 */
function strip(d) {
  const {monthly, ...rest} = d
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
  return b.monthly - a.monthly
}
