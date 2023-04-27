/**
 * @typedef {import('trough').Callback} Next
 * @typedef {import('trough').Pipeline} Pipeline
 * @typedef {import('vfile').VFile} VFile
 * @typedef {import('type-fest').PackageJson} PackageJson
 * @typedef {import('sharp').Sharp} Sharp
 *
 * @typedef {'jpeg'|'jp2'|'png'|'webp'|'gif'|'avif'|'heif'|'tiff'|'raw'} SharpKey
 * @typedef {{[key in SharpKey]?: Parameters<Sharp[key]>[0]}} SharpConfig
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import {promisify} from 'node:util'
import {glob} from 'glob'
import sharp from 'sharp'
import all from 'p-all'
import {trough} from 'trough'
import {toVFile} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import {Processor as PostCss} from 'postcss'
import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'

const postcss = new PostCss([
  // @ts-expect-error: types out of date?
  postcssPresetEnv({stage: 0}),
  cssnano({preset: 'advanced'})
])

/** @type {PackageJson} */
const pack = JSON.parse(String(await fs.readFile('package.json')))

/** @type {Record<string, Pipeline>} */
const externals = {
  '.css': trough().use(transformCss),
  '.png': trough().use(
    transformImageFactory({
      webp: {quality: 50, alphaQuality: 50},
      png: {quality: 50}
    })
  ),
  '.jpg': trough().use(
    transformImageFactory({webp: {quality: 50}, jpeg: {quality: 50}})
  )
}

const processPipeline = trough()
  .use(toVFile.read)
  .use(process)
  .use(move)
  .use(mkdir)
  .use(toVFile.write)

const copyPipeline = trough().use(move).use(mkdir).use(copy)

const imagePipeline = trough()
  .use(move)
  .use(mkdir)
  .use(toVFile.write)
  .use(print)

const filePipeline = trough()
  .use(
    /**
     *  @param {string} fp
     *  @param {Next} next
     */
    (fp, next) => {
      const file = toVFile(fp)
      const ext = file.extname
      const pipeline = ext && ext in externals ? processPipeline : copyPipeline
      pipeline.run(file, next)
    }
  )
  .use(print)

trough()
  .use(glob)
  .use(
    /**
     *  @param {Array<string>} paths
     *  @param {Next} done
     */
    (paths, done) => {
      /** @type {(fp: string) => Promise<VFile>} */
      const run = promisify(filePipeline.run)

      all(
        paths.map((path) => () => run(path)),
        {concurrency: 3}
      ).then((files) => done(null, files), done)
    }
  )
  .use((files, next) => {
    assert(pack.homepage, 'expected `homepage` in `package.json`')
    const value = new URL(pack.homepage).host + '\n'
    toVFile.write({dirname: 'build', basename: 'CNAME', value}, next)
  })
  .run(
    'asset/**/*.*',
    /**
     * @param {Error|null} error
     */
    (error) => {
      if (error) throw error
    }
  )

/**
 *
 * @param {VFile} file
 * @param {Next} next
 */
function process(file, next) {
  assert(file.extname, 'expected `extname` in `file`')
  externals[file.extname].run(
    file,
    /** @type {Next} */
    (error) => {
      next(error)
    }
  )
}

/**
 * @param {VFile} file
 */
function move(file) {
  assert(file.dirname, 'expected `dirname` on file')
  const sep = path.sep
  file.dirname = ['build'].concat(file.dirname.split(sep).slice(1)).join(sep)
}

/**
 * @param {VFile} file
 */
async function mkdir(file) {
  assert(file.dirname, 'expected `dirname` on file')
  await fs.mkdir(file.dirname, {recursive: true})
}

/**
 * @param {VFile} file
 */
async function copy(file) {
  await fs.copyFile(file.history[0], file.path)
}

/**
 * @param {VFile} file
 */
function print(file) {
  file.stored = true
  // Clear memory.
  // @ts-expect-error: hush
  file.value = null
  console.error(reporter(file))
}

/**
 * @param {VFile} file
 */
async function transformCss(file) {
  const result = await postcss.process(file.toString('utf8'), {from: file.path})
  file.value = result.css
}

/**
 * @param {SharpConfig} options
 */
function transformImageFactory(options) {
  return transform
  /**
   * @param {VFile} file
   * @param {Next} next
   */
  function transform(file, next) {
    const sizes = [600, 1200, 2400, 3600]
    /** @type {Array<SharpKey>} */
    // @ts-expect-error: yeah they are keys.
    const formats = Object.keys(options)
    /** @type {(file: VFile) => Promise<VFile>} */
    const run = promisify(imagePipeline.run)
    const pipeline = sharp(file.value)

    pipeline
      .metadata()
      .then((metadata) =>
        all(
          sizes
            .flatMap((size) => formats.map((format) => ({size, format})))
            .filter(
              (d) =>
                typeof metadata.width === 'number' && d.size <= metadata.width
            )
            .map((config) => () => one(config).then((d) => run(d))),
          {concurrency: 3}
        )
      )
      .then(
        () => next(null, file),
        (error) => {
          next(
            new Error('Could not transform image `' + file.path + '`: ' + error)
          )
        }
      )

    /***
     * @param {{size: number, format: SharpKey}} media
     * @returns {Promise<VFile>}
     */
    function one(media) {
      const format = media.format
      const config = options[format]
      // @ts-expect-error: key and value match.
      const fn = pipeline.clone().resize(media.size)[format](config)

      return fn.toBuffer().then((buf) => {
        const copy = toVFile(file.path)

        copy.value = buf
        copy.stem += '-' + media.size
        copy.extname = '.' + media.format

        return copy
      })
    }
  }
}
