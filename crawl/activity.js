import {promises as fs} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ref = process.env.STRA_R_TOKEN
const cId = process.env.STRA_C_ID
const cSecret = process.env.STRA_C_SECRET

if (!ref) throw new Error('Missing `STRA_R_TOKEN`')
if (!cId) throw new Error('Missing `STRA_C_ID`')
if (!cSecret) throw new Error('Missing `STRA_C_SECRET`')

const URLSearchParameters = url.URLSearchParams

const outpath = path.join('data', 'activities.json')

main().catch((error) => {
  console.log(error)
  throw new Error('Could not get activities')
})

async function main() {
  const parameters = new URLSearchParameters()
  parameters.append('client_id', cId)
  parameters.append('client_secret', cSecret)
  parameters.append('grant_type', 'refresh_token')
  parameters.append('refresh_token', ref)

  // Get token.
  const tokenResponse = await fetch(
    'https://www.strava.com/api/v3/oauth/token',
    {
      method: 'POST',
      body: parameters
    }
  )
  const tokenData = await tokenResponse.json()
  const token = tokenData.access_token

  const allActivitiesReponse = await fetch(
    'https://www.strava.com/api/v3/athlete/activities',
    {
      headers: {Authorization: 'Bearer ' + token}
    }
  )
  const allActivities = await allActivitiesReponse.json()

  const activities = allActivities.map((d) => {
    const movingTime = d.moving_time
    const h = Math.floor(movingTime / 60 / 60)
    const m = Math.floor((movingTime - h * 60 * 60) / 60)
    const mDisplay = String(m).padStart(2, '0')
    const distance = (d.distance / 1000).toFixed(1) + 'km'
    const mpkm = ((5 / 3) * 10) / d.average_speed
    const min = Math.floor(mpkm)
    const duration = h > 0 ? h + ':' + mDisplay + 'h' : mDisplay + 'min'
    const speed =
      min + ':' + (((mpkm - min) / 100) * 60).toFixed(2).split('.')[1]

    return {
      date: d.start_date_local.split('T')[0],
      distance,
      duration,
      speed,
      polyline: d.map.summary_polyline
    }
  })

  await fs.mkdir(path.dirname(outpath), {recursive: true})
  await fs.writeFile(outpath, JSON.stringify(activities, null, 2) + '\n')
}
