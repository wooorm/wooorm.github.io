import {promises as fs} from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

var key = process.env.GH_TOKEN

if (!key) throw new Error('Missing `GH_TOKEN`')

var outpath = path.join('data', 'github-sponsors.json')

var endpoint = 'https://api.github.com/graphql'

var query = `query($org: String!) {
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

fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify({query, variables: {org: 'unifiedjs'}}),
  headers: {'Content-Type': 'application/json', Authorization: 'bearer ' + key}
})
  .then((response) => response.json())
  .catch((error) => console.log(error))
  .then(function ({data}) {
    const collective = data.organization.sponsorshipsAsMaintainer.nodes
      .map((d) => clean(d))
      .sort(sort)
      .map((d) => Object.assign(d, {monthly: undefined}))
    const personal = data.viewer.sponsorshipsAsMaintainer.nodes
      .map((d) => clean(d))
      .sort(sort)
      .map((d) => Object.assign(d, {monthly: undefined}))

    return fs
      .mkdir(path.dirname(outpath), {recursive: true})
      .then(() =>
        fs.writeFile(
          outpath,
          JSON.stringify({collective, personal}, null, 2) + '\n'
        )
      )
  })
  .catch((_) => {
    throw new Error('Could not get sponsors')
  })

function clean(d) {
  return {
    github: d.sponsorEntity.login,
    name: d.sponsorEntity.name,
    description: d.sponsorEntity.bio || d.sponsorEntity.description,
    image: d.sponsorEntity.avatarUrl,
    url: d.sponsorEntity.websiteUrl,
    monthly: d.tier.monthlyPriceInDollars
  }
}

function sort(a, b) {
  return b.monthly - a.monthly
}
