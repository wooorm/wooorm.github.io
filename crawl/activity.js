/**
 * @typedef Activity
 *   Activity.
 * @property {string} date
 *   Date.
 * @property {string} distance
 *   Distance.
 * @property {string} duration
 *   Duration.
 * @property {string} polyline
 *   Polyline.
 * @property {string} speed
 *   Speed.
 *
 * @typedef StravaActivity
 *   Strava activity.
 * @property {number} achievement_count
 *   Achievement count.
 * @property {Readonly<StravaUser>} athlete
 *   Athlete.
 * @property {number} athlete_count
 *   Athlete count.
 * @property {number} average_heartrate
 *   Average heartrate.
 * @property {number} average_speed
 *   Average speed.
 * @property {number} comment_count
 *   Comment count.
 * @property {boolean} commute
 *   Commute.
 * @property {boolean} display_hide_heartrate_option
 *   Display hide heartrate option.
 * @property {number} distance
 *   Distance.
 * @property {number} elapsed_time
 *   Elapsed time.
 * @property {number} elev_high
 *   Elevation high.
 * @property {number} elev_low
 *   Elevation low.
 * @property {Readonly<StravaGeo>} end_latlng
 *   End location.
 * @property {string} external_id
 *   Unknown.
 * @property {boolean} flagged
 *   Flagged.
 * @property {boolean} from_accepted_tag
 *   Unknown.
 * @property {string} gear_id
 *   Gear ID.
 * @property {boolean} has_heartrate
 *   Has heartrate.
 * @property {boolean} has_kudoed
 *   Has kudoed.
 * @property {boolean} heartrate_opt_out
 *   Heartrate opt out.
 * @property {number} id
 *   ID.
 * @property {number} kudos_count
 *   Kudos count.
 * @property {unknown} location_city
 *   Location city.
 * @property {unknown} location_country
 *   Location country.
 * @property {unknown} location_state
 *   Location state.
 * @property {boolean} manual
 *   Manual.
 * @property {Readonly<StravaMap>} map
 *   Map.
 * @property {number} max_heartrate
 *   Max heartrate.
 * @property {number} max_speed
 *   Max speed.
 * @property {number} moving_time
 *   Moving time.
 * @property {string} name
 *   Name.
 * @property {number} photo_count
 *   Photo count.
 * @property {boolean} private
 *   Private.
 * @property {number} pr_count
 *   PR count.
 * @property {number} resource_state
 *   Resource state.
 * @property {string} start_date
 *   Start date.
 * @property {string} start_date_local
 *   Start date local.
 * @property {Readonly<StravaGeo>} start_latlng
 *   Start location.
 * @property {number} suffer_score
 *   Suffer score.
 * @property {string} timezone
 *   Timezone.
 * @property {number} total_elevation_gain
 *   Total elevation gain.
 * @property {number} total_photo_count
 *   Total photo count.
 * @property {boolean} trainer
 *   Unknown.
 * @property {unknown} type
 *   Unknown.
 * @property {number} upload_id
 *   Upload ID.
 * @property {string} upload_id_str
 *   Unknown.
 * @property {number} utc_offset
 *   UTC offset.
 * @property {string} visibility
 *   Visibility.
 * @property {number | null | undefined} workout_type
 *   Workout type.
 *
 * @typedef {[lat: number, lng: number]} StravaGeo
 *   Lat/Lng.
 *
 * @typedef StravaMap
 *   Strava map.
 * @property {string} id
 *   ID.
 * @property {number} resource_state
 *   Resource state.
 * @property {string} summary_polyline
 *   Summary polyline.
 *
 * @typedef StravaTokenData
 *   Strava token data.
 * @property {string} access_token
 *   Access token.
 * @property {number} expires_at
 *   Expires at.
 * @property {number} expires_in
 *   Expires in.
 * @property {string} refresh_token
 *   Refresh token.
 * @property {string} token_type
 *   Token type.
 *
 * @typedef StravaUser
 *   Strava user.
 * @property {number} id
 *   ID.
 * @property {number} resource_state
 *   Resource state.
 *
 */

import fs from 'node:fs/promises'
import process from 'node:process'
import dotenv from 'dotenv'
import {fetch} from 'undici'

dotenv.config()

const refreshToken = process.env.STRA_R_TOKEN
const cId = process.env.STRA_C_ID
const cSecret = process.env.STRA_C_SECRET

if (!refreshToken) throw new Error('Missing `STRA_R_TOKEN`')
if (!cId) throw new Error('Missing `STRA_C_ID`')
if (!cSecret) throw new Error('Missing `STRA_C_SECRET`')

const outUrl = new URL('../data/activities.json', import.meta.url)

const parameters = new URLSearchParams()
parameters.append('client_id', cId)
parameters.append('client_secret', cSecret)
parameters.append('grant_type', 'refresh_token')
parameters.append('refresh_token', refreshToken)

// Get token.
const tokenResponse = await fetch('https://www.strava.com/api/v3/oauth/token', {
  body: parameters,
  method: 'POST'
})
const tokenData = /** @type {Readonly<StravaTokenData>} */ (
  await tokenResponse.json()
)
const token = tokenData.access_token

const allActivitiesReponse = await fetch(
  'https://www.strava.com/api/v3/athlete/activities',
  {headers: {Authorization: 'Bearer ' + token}}
)
const allActivities = /** @type {ReadonlyArray<Readonly<StravaActivity>>} */ (
  await allActivitiesReponse.json()
)

const activities = allActivities.map(function (d) {
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

  /** @type {Readonly<Activity>} */
  const activity = {
    date: d.start_date_local.split('T')[0],
    distance,
    duration,
    polyline: d.map.summary_polyline,
    speed
  }

  return activity
})

await fs.mkdir(new URL('./', outUrl), {recursive: true})
await fs.writeFile(outUrl, JSON.stringify(activities, undefined, 2) + '\n')
