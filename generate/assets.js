/**
 * @typedef {import('sharp').Sharp} Sharp
 *
 * @typedef {import('trough').Callback} Callback
 * @typedef {import('trough').Pipeline} Pipeline
 *
 * @typedef {import('type-fest').PackageJson} PackageJson
 */

/**
 * @typedef {{[key in SharpKey]?: Parameters<Sharp[key]>[0]}} SharpConfig
 *   Configuration.
 *
 * @typedef {'avif' | 'gif' | 'heif' | 'jp2' | 'jpeg' | 'png' | 'raw' | 'tiff' | 'webp'} SharpKey
 *   Sharp key.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {promisify} from 'node:util'
import cssnano from 'cssnano'
import {glob} from 'glob'
import all from 'p-all'
import {Processor as PostCss} from 'postcss'
import postcssPresetEnv from 'postcss-preset-env'
import sharp from 'sharp'
import {read, write} from 'to-vfile'
import {trough} from 'trough'
import {VFile} from 'vfile'
import {reporter} from 'vfile-reporter'

const postcss = new PostCss([
  postcssPresetEnv({stage: 0}),
  cssnano({preset: 'advanced'})
])

/** @type {Readonly<PackageJson>} */
const pack = JSON.parse(String(await fs.readFile('package.json')))

/** @type {Record<string, Pipeline>} */
const externals = {
  '.css': trough().use(transformCss),
  '.png': trough().use(
    transformImageFactory({
      png: {quality: 50},
      webp: {alphaQuality: 50, quality: 50}
    })
  ),
  '.jpg': trough().use(
    transformImageFactory({jpeg: {quality: 50}, webp: {quality: 50}})
  )
}

const processPipeline = trough()
  .use(read)
  .use(process)
  .use(move)
  .use(mkdir)
  .use(write)

const copyPipeline = trough().use(move).use(mkdir).use(copy)

const imagePipeline = trough().use(move).use(mkdir).use(write).use(print)

const filePipeline = trough()
  .use(
    /**
     * @param {string} fp
     *   File path.
     * @param {Callback} next
     *   Callback.
     * @returns {undefined}
     *   Nothing.
     */
    function (fp, next) {
      const file = new VFile({path: fp})
      const extname = file.extname
      const pipeline =
        extname && extname in externals ? processPipeline : copyPipeline
      pipeline.run(file, next)
    }
  )
  .use(print)

trough()
  .use(glob)
  .use(
    /**
     * @param {ReadonlyArray<string>} paths
     *   File paths.
     * @param {Callback} done
     *   Callback.
     * @returns {undefined}
     *   Nothing.
     */
    function (paths, done) {
      /** @type {(fp: string) => Promise<VFile>} */
      const run = promisify(filePipeline.run)

      all(
        paths.map(function (path) {
          return function () {
            return run(path)
          }
        }),
        {concurrency: 3}
      ).then(function (files) {
        return done(undefined, files)
      }, done)
    }
  )
  .use(
    /**
     * @param {ReadonlyArray<VFile>} _
     *   Files.
     * @param {Callback} next
     *   Callback.
     * @returns {undefined}
     *   Nothing.
     */
    function (_, next) {
      assert(pack.homepage, 'expected `homepage` in `package.json`')
      const value = new URL(pack.homepage).host + '\n'
      write({basename: 'CNAME', dirname: 'build', value}, function (error) {
        next(error)
      })
    }
  )
  .run(
    'asset/**/*.*',
    /**
     * @param {Error | undefined} error
     *   Error.
     * @returns {undefined}
     *   Nothing.
     */
    function (error) {
      if (error) throw error
    }
  )

/**
 *
 * @param {VFile} file
 *   File.
 * @param {Callback} next
 *   Callback.
 * @returns {undefined}
 *   Nothing.
 */
function process(file, next) {
  assert(file.extname, 'expected `extname` in `file`')
  externals[file.extname].run(
    file,
    /** @type {Callback} */
    function (error) {
      next(error)
    }
  )
}

/**
 * @param {VFile} file
 *   File.
 * @returns {undefined}
 *   Nothing.
 */
function move(file) {
  assert(file.dirname, 'expected `dirname` on file')
  const parts = ['build', ...file.dirname.split(path.sep).slice(1)]
  file.dirname = parts.join(path.sep)
}

/**
 * @param {VFile} file
 *   File.
 * @returns {Promise<undefined>}
 *   Nothing.
 */
async function mkdir(file) {
  assert(file.dirname, 'expected `dirname` on file')
  await fs.mkdir(file.dirname, {recursive: true})
}

/**
 * @param {VFile} file
 *   File.
 * @returns {Promise<undefined>}
 *   Nothing.
 */
async function copy(file) {
  await fs.copyFile(file.history[0], file.path)
}

/**
 * @param {VFile} file
 *   File.
 * @returns {undefined}
 *   Nothing.
 */
function print(file) {
  file.stored = true
  console.error(reporter(file))
}

/**
 * @param {VFile} file
 *   File.
 * @returns {Promise<undefined>}
 *   Nothing.
 */
async function transformCss(file) {
  const result = await postcss.process(file.toString('utf8'), {from: file.path})
  file.value = result.css
}

/**
 * @param {SharpConfig} options
 *   Configuration.
 * @returns
 *   Transform.
 */
function transformImageFactory(options) {
  return transform

  /**
   * @param {VFile} file
   *   File.
   * @param {Callback} next
   *   Callback.
   * @returns {undefined}
   *   Nothing.
   */
  function transform(file, next) {
    const sizes = [600, 1200, 2400, 3600]
    const formats = /** @type {ReadonlyArray<SharpKey>} */ (
      Object.keys(options)
    )
    /** @type {(file: VFile) => Promise<VFile>} */
    const run = promisify(imagePipeline.run)
    const pipeline = sharp(file.value)

    pipeline
      .metadata()
      .then(function (metadata) {
        return all(
          sizes
            .flatMap(function (size) {
              return formats.map(function (format) {
                return {format, size}
              })
            })
            .filter(function (d) {
              return (
                typeof metadata.width === 'number' && d.size <= metadata.width
              )
            })
            .map(function (config) {
              return function () {
                return one(config).then(function (d) {
                  return run(d)
                })
              }
            }),
          {concurrency: 3}
        )
      })
      .then(
        function () {
          return next(undefined, file)
        },
        /**
         * @param {Error | null | undefined} [error]
         */
        function (error) {
          next(
            new Error('Could not transform image `' + file.path + '`: ' + error)
          )
        }
      )

    /***
     * @param {{format: SharpKey, size: number}} media
     *   Media.
     * @returns {Promise<VFile>}
     *   File.
     */
    function one(media) {
      const format = media.format
      const config = options[format]
      // @ts-expect-error: key and value match.
      const sharp = pipeline.clone().resize(media.size)[format](config)

      return sharp.toBuffer().then(function (buf) {
        const copy = new VFile({path: file.path})

        copy.extname = '.' + media.format
        copy.stem += '-' + media.size
        copy.value = buf

        return copy
      })
    }
  }
}
