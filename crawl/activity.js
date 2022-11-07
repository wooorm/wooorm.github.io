/**
 * @typedef Activity
 * @property {string} date
 * @property {string} distance
 * @property {string} duration
 * @property {string} speed
 * @property {string} polyline
 *
 * @typedef StravaTokenData
 * @property {string} token_type
 * @property {string} access_token
 * @property {number} expires_at
 * @property {number} expires_in
 * @property {string} refresh_token
 *
 * @typedef StravaMap
 * @property {string} id
 * @property {string} summary_polyline
 * @property {number} resource_state
 *
 * @typedef StravaUser
 * @property {number} id
 * @property {number} resource_state
 *
 * @typedef {[number, number]} StravaGeo
 *   Lat/Lng.
 *
 * @typedef StravaActivity
 * @property {number} resource_state
 * @property {StravaUser} athlete
 * @property {string} name
 * @property {number} distance
 * @property {number} moving_time
 * @property {number} elapsed_time
 * @property {number} total_elevation_gain
 * @property {unknown} type
 * @property {number|null} workout_type
 * @property {number} id
 * @property {string} start_date
 * @property {string} start_date_local
 * @property {string} timezone
 * @property {number} utc_offset
 * @property {null} location_city
 * @property {null} location_state
 * @property {null} location_country
 * @property {number} achievement_count
 * @property {number} kudos_count
 * @property {number} comment_count
 * @property {number} athlete_count
 * @property {number} photo_count
 * @property {StravaMap} map
 * @property {boolean} trainer
 * @property {boolean} commute
 * @property {boolean} manual
 * @property {boolean} private
 * @property {string} visibility
 * @property {boolean} flagged
 * @property {string} gear_id
 * @property {StravaGeo} start_latlng
 * @property {StravaGeo} end_latlng
 * @property {number} average_speed
 * @property {number} max_speed
 * @property {boolean} has_heartrate
 * @property {number} average_heartrate
 * @property {number} max_heartrate
 * @property {boolean} heartrate_opt_out
 * @property {boolean} display_hide_heartrate_option
 * @property {number} elev_high
 * @property {number} elev_low
 * @property {number} upload_id
 * @property {string} upload_id_str
 * @property {string} external_id
 * @property {boolean} from_accepted_tag
 * @property {number} pr_count
 * @property {number} total_photo_count
 * @property {boolean} has_kudoed
 * @property {number} suffer_score
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

dotenv.config()

const ref = process.env.STRA_R_TOKEN
const cId = process.env.STRA_C_ID
const cSecret = process.env.STRA_C_SECRET

if (!ref) throw new Error('Missing `STRA_R_TOKEN`')
if (!cId) throw new Error('Missing `STRA_C_ID`')
if (!cSecret) throw new Error('Missing `STRA_C_SECRET`')

const outUrl = new URL('../data/activities.json', import.meta.url)

const parameters = new URLSearchParams()
parameters.append('client_id', cId)
parameters.append('client_secret', cSecret)
parameters.append('grant_type', 'refresh_token')
parameters.append('refresh_token', ref)

// Get token.
const tokenResponse = await fetch('https://www.strava.com/api/v3/oauth/token', {
  method: 'POST',
  body: parameters
})
const tokenData = /** @type {StravaTokenData} */ (await tokenResponse.json())
const token = tokenData.access_token

const allActivitiesReponse = await fetch(
  'https://www.strava.com/api/v3/athlete/activities',
  {
    headers: {Authorization: 'Bearer ' + token}
  }
)
const allActivities = /** @type {Array<StravaActivity>} */ (
  await allActivitiesReponse.json()
)

const activities = allActivities.map((d) => {
  const movingTime = d.moving_time
  const h = Math.floor(movingTime / 60 / 60)
  const m = Math.floor((movingTime - h * 60 * 60) / 60)
  const mDisplay = String(m).padStart(2, '0')
  const distance = (d.distance / 1000).toFixed(1) + 'km'
  const mpkm = ((5 / 3) * 10) / d.average_speed
  const min = Math.floor(mpkm)
  const seconds = Math.floor(((mpkm - min) / 100) * 60 * 100) / 100
  const duration = h > 0 ? h + ':' + mDisplay + 'h' : mDisplay + 'min'
  const speed = min + ':' + seconds.toFixed(2).split('.')[1]

  /** @type {Activity} */
  const activity = {
    date: d.start_date_local.split('T')[0],
    distance,
    duration,
    speed,
    polyline: d.map.summary_polyline
  }

  return activity
})

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(activities, null, 2) + '\n')
