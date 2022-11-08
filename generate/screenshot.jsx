/**
 * @typedef {import('satori').SatoriOptions['fonts'][number]} Font
 * @typedef {Exclude<Font['weight'], undefined>} FontWeight
 * @typedef {Exclude<Font['style'], undefined>} FontStyle
 */

/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
// eslint-disable-next-line no-unused-vars
import React from 'react'
import satori from 'satori'
import {resolve} from 'import-meta-resolve'
import {Resvg} from '@resvg/resvg-js'

const fontFilesUrl = new URL(
  await resolve('@fontsource/open-sans/files/', import.meta.url)
)
const fontFiles = await fs.readdir(fontFilesUrl)
const acceptableFontFiles = fontFiles.filter((d) =>
  d.startsWith('open-sans-all')
)
const fonts = await Promise.all(
  acceptableFontFiles.map(
    /**
     * @returns {Promise<Font>}
     */
    async (basename) => {
      const parts = basename.split('.')[0].split('-')
      const weight = /** @type {FontWeight} */ (Number.parseInt(parts[3], 10))
      const style = /** @type {FontStyle} */ (parts[4])
      assert(
        [100, 200, 300, 400, 500, 600, 700, 800, 900].includes(weight),
        `expected valid weight ${weight}`
      )
      assert(
        style === 'normal' || style === 'italic',
        `expected valid style ${style}`
      )

      return {
        name: 'Open Sans',
        data: await fs.readFile(new URL(basename, fontFilesUrl)),
        weight,
        style
      }
    }
  )
)

/**
 * Generate an OG image.
 *
 * @param {import('vfile').DataMap['meta']} meta
 * @returns {Promise<import('node:buffer').Buffer>}
 */
export async function generateOgImage(meta) {
  const dateTimeFormat = new Intl.DateTimeFormat('en', {dateStyle: 'long'})
  const modifiedLabel = dateTimeFormat.format(
    typeof meta.modified === 'object'
      ? meta.modified
      : meta.modified
      ? new Date(meta.modified)
      : new Date()
  )
  const time = (
    meta.readingTime
      ? Array.isArray(meta.readingTime)
        ? meta.readingTime
        : [meta.readingTime, meta.readingTime]
      : []
  ).map((d) => Math.ceil(d))
  /** @type {string|undefined} */
  let timeLabel

  if (time.length > 1 && time[0] !== time[1]) {
    timeLabel = time[0] + '-' + time[1] + ' minutes'
  } else if (time[0]) {
    timeLabel = time[0] + ' minute' + (time[0] > 1 ? 's' : '')
  }

  const svg = await satori(
    <div
      style={{
        color: 'black',
        display: 'flex',
        height: '100%',
        width: '100%',
        backgroundColor: 'black',
        fontSize: '32px',
        padding: '32px 0'
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexFlow: 'column',
          backgroundColor: 'white'
        }}
      >
        {/* Title */}
        <div style={{margin: '32px', display: 'flex'}}>
          <div
            style={{
              width: '100%',
              height: '100%',
              fontWeight: '700',
              fontStyle: 'normal',
              fontSize: '64px',
              // Satori has bugs with text overflow, so this doesn’t often show.
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            {meta.title}
          </div>
        </div>
        {/* Description */}
        <div
          style={{
            margin: '32px',
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex'
          }}
        >
          <div style={{display: 'flex', overflow: 'hidden'}}>
            {meta.description}
          </div>
        </div>
        {/* Meta */}
        <div style={{margin: '32px', display: 'flex', flexShrink: 0}}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '40%',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {meta.author ? (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <small style={{fontSize: '24px'}}>By</small>
                  <b>{meta.author}</b>
                </div>
              ) : undefined}
              {meta.author && timeLabel ? (
                <br style={{marginBottom: '16px'}} />
              ) : undefined}
              {timeLabel ? (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <small style={{fontSize: '24px'}}>Reading time</small>
                  <b>{timeLabel}</b>
                </div>
              ) : undefined}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '40%',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {modifiedLabel ? (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <small style={{fontSize: '24px'}}>Last modified on</small>
                  <b>{modifiedLabel}</b>
                </div>
              ) : undefined}
            </div>
          </div>
        </div>
      </div>
    </div>,
    {width: 1200, height: 628, fonts}
  )

  const resvg = new Resvg(svg, {
    background: 'white', // Solid.
    fitTo: {mode: 'zoom', value: 2} // Double size.
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  return pngBuffer
}
