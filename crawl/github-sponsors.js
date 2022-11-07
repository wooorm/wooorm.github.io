/**
 * @typedef Sponsors
 * @property {Array<Sponsor>} collective
 * @property {Array<Sponsor>} personal
 *
 * @typedef {Omit<SponsorRaw, 'monthly'>} Sponsor
 *
 * @typedef SponsorRaw
 * @property {string} github
 * @property {string|null} name
 * @property {string|null} description
 * @property {string} image
 * @property {string|null} url
 * @property {number} monthly
 *
 * @typedef GithubSponsor
 * @property {string} login
 * @property {string|null} name
 * @property {string|null} [bio]
 * @property {string|null} [description]
 * @property {string} avatarUrl
 * @property {string|null} websiteUrl
 *
 * @typedef GithubTier
 * @property {number} monthlyPriceInDollars
 *
 * @typedef GithubSponsorNode
 * @property {GithubSponsor} sponsorEntity
 * @property {GithubTier} tier
 *
 * @typedef GithubOrganizationData
 * @property {{nodes: Array<GithubSponsorNode>}} sponsorshipsAsMaintainer
 *
 * @typedef GithubViewerData
 * @property {{nodes: Array<GithubSponsorNode>}} sponsorshipsAsMaintainer
 *
 * @typedef GithubSponsorsResponse
 * @property {{organization: GithubOrganizationData, viewer: GithubViewerData}} data
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

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
  method: 'POST',
  body: JSON.stringify({query, variables: {org: 'unifiedjs'}}),
  headers: {'Content-Type': 'application/json', Authorization: 'bearer ' + key}
})
const body = /** @type {GithubSponsorsResponse} */ (await response.json())

const collective = body.data.organization.sponsorshipsAsMaintainer.nodes
  .map((d) => clean(d))
  .sort(sort)
  .map((d) => strip(d))
const personal = body.data.viewer.sponsorshipsAsMaintainer.nodes
  .map((d) => clean(d))
  .sort(sort)
  .map((d) => strip(d))

await fs.mkdir(new URL('../', outUrl), {recursive: true})
await fs.writeFile(
  outUrl,
  JSON.stringify({collective, personal}, null, 2) + '\n'
)

/**
 * @param {GithubSponsorNode} d
 * @returns {SponsorRaw}
 */
function clean(d) {
  return {
    github: d.sponsorEntity.login,
    name: d.sponsorEntity.name,
    description: d.sponsorEntity.bio || d.sponsorEntity.description || null,
    image: d.sponsorEntity.avatarUrl,
    url: d.sponsorEntity.websiteUrl,
    monthly: d.tier.monthlyPriceInDollars
  }
}

/**
 * @param {SponsorRaw} d
 * @returns {Sponsor}
 */
function strip(d) {
  return Object.assign(d, {monthly: undefined})
}

/**
 * @param {SponsorRaw} a
 * @param {SponsorRaw} b
 */
function sort(a, b) {
  return b.monthly - a.monthly
}
