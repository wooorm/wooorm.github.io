/**
 * @import {SatoriOptions} from 'satori'
 * @import {DataMap} from 'vfile'
 */

/**
 * @typedef {Fonts[number]} FontOptions
 *   Font options.
 *
 * @typedef {Exclude<FontOptions['style'], undefined>} FontStyle
 *   Font style.
 *
 * @typedef {Exclude<FontOptions['weight'], undefined>} FontWeight
 *   Font weight.
 *
 * @typedef {SatoriOptions['fonts']} Fonts
 *   Fonts.
 */

/* @jsx React.createElement */
/* @jsxFrag React.Fragment */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {Resvg} from '@resvg/resvg-js'
import {resolve} from 'import-meta-resolve'
// eslint-disable-next-line no-unused-vars
import React from 'react'
import satori from 'satori'

const openSansUrl = new URL(
  resolve('@fontsource/open-sans/package.json', import.meta.url)
)
const fontFilesUrl = new URL('files/', openSansUrl)
const fontFiles = await fs.readdir(fontFilesUrl)
const acceptableFontFiles = fontFiles.filter(function (d) {
  return /^open-sans-latin(?!-ext)/.test(d) && d.endsWith('.woff')
})
const fonts = await Promise.all(
  acceptableFontFiles.map(
    /**
     * @param {string} basename
     *   Basename.
     * @returns {Promise<FontOptions>}
     *   Font options.
     */
    async function (basename) {
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
        data: await fs.readFile(new URL(basename, fontFilesUrl)),
        name: 'Open Sans',
        style,
        weight
      }
    }
  )
)

/**
 * Generate an OG image.
 *
 * @param {DataMap['meta']} meta
 *   Meta.
 * @returns {Promise<Uint8Array>}
 *   Image.
 */
export async function generateOgImage(meta) {
  const dateTimeFormat = new Intl.DateTimeFormat('en', {dateStyle: 'long'})
  const modifiedLabel = dateTimeFormat.format(
    meta.modified && typeof meta.modified === 'object'
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
  ).map(function (d) {
    return Math.ceil(d)
  })
  /** @type {string | undefined} */
  let timeLabel

  if (time.length > 1 && time[0] !== time[1]) {
    timeLabel = time[0] + '-' + time[1] + ' minutes'
  } else if (time[0]) {
    timeLabel = time[0] + ' minute' + (time[0] > 1 ? 's' : '')
  }

  const svg = await satori(
    <div
      style={{
        backgroundColor: 'black',
        color: 'black',
        display: 'flex',
        fontSize: '32px',
        height: '100%',
        padding: '32px 0',
        width: '100%'
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          display: 'flex',
          flexFlow: 'column',
          height: '100%',
          width: '100%'
        }}
      >
        {/* Title */}
        <div style={{display: 'flex', margin: '32px'}}>
          <div
            style={{
              height: '100%',
              flexShrink: 0,
              fontSize: '64px',
              fontStyle: 'normal',
              fontWeight: '700',
              // Satori has bugs with text overflow, so this doesn’t often show.
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {meta.title}
          </div>
        </div>
        {/* Description */}
        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            margin: '32px',
            overflow: 'hidden'
          }}
        >
          <div style={{display: 'flex', overflow: 'hidden'}}>
            {meta.description}
          </div>
        </div>
        {/* Meta */}
        <div style={{display: 'flex', flexShrink: 0, margin: '32px'}}>
          <div
            style={{
              display: 'flex',
              height: '100%',
              justifyContent: 'space-between',
              width: '100%'
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
    {fonts, height: 628, width: 1200}
  )

  const resvg = new Resvg(svg, {
    background: 'white', // Solid.
    fitTo: {mode: 'zoom', value: 2} // Double size.
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()
  return pngBuffer
}
