import fs from 'fs'
import path from 'path'
import {promisify} from 'util'
import glob from 'glob'
import sharp from 'sharp'
import all from 'p-all'
import {mkdirp} from 'vfile-mkdirp'
import {trough} from 'trough'
import {toVFile} from 'to-vfile'
import {reporter} from 'vfile-reporter'
import postcss from 'postcss'
import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'

const pack = JSON.parse(fs.readFileSync('package.json'))

const externals = {
  '.css': trough().use(transformCss),
  '.png': trough().use(
    transformImageFactory({
      webp: {quality: 50, alphaQuality: 50},
      png: {quality: 50}
    })
  ),
  '.jpg': trough().use(
    transformImageFactory({webp: {quality: 50}, jpg: {quality: 50}})
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
  .use((fp, next) => {
    const file = toVFile(fp)
    const ext = file.extname
    const pipeline = ext in externals ? processPipeline : copyPipeline
    pipeline.run(file, next)
  })
  .use(print)

trough()
  .use(glob)
  .use((paths, done) => {
    const run = promisify(filePipeline.run)

    all(
      paths.map((path) => () => run(path)),
      {concurrency: 3}
    ).then((files) => done(null, files), done)
  })
  .use((files, next) => {
    const value = new URL(pack.homepage).host + '\n'
    toVFile.write({dirname: 'build', basename: 'CNAME', value}, next)
  })
  .run('asset/**/*.*', (error) => {
    if (error) throw error
  })

function process(file, next) {
  externals[file.extname].run(file, (error) => {
    file.processed = true
    next(error)
  })
}

function move(file) {
  const sep = path.sep
  file.dirname = ['build'].concat(file.dirname.split(sep).slice(1)).join(sep)
}

function mkdir(file, next) {
  mkdirp(file, done)
  function done(error) {
    next(error)
  }
}

function copy(file, next) {
  fs.copyFile(file.history[0], file.path, done)
  function done(error) {
    next(error)
  }
}

function print(file) {
  file.stored = true

  // Clear memory.
  file.value = null
  console.error(reporter(file))
}

function transformCss(file) {
  return postcss(postcssPresetEnv({stage: 0}), cssnano({preset: 'advanced'}))
    .process(file.toString('utf8'), {from: file.path})
    .then((result) => {
      file.value = result.css
    })
}

function transformImageFactory(options) {
  return transform
  function transform(file, next) {
    const sizes = [600, 1200, 2400, 3600]
    const formats = Object.keys(options)

    const run = promisify(imagePipeline.run)
    const pipeline = sharp(file.value)

    pipeline
      .metadata()
      .then((metadata) =>
        all(
          sizes
            .flatMap((size) => formats.map((format) => ({size, format})))
            .filter((d) => d.size <= metadata.width)
            .map((file) => () => one(file).then((d) => run(d))),
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

    function one(media) {
      const format = media.format
      const method = format === 'jpg' ? 'jpeg' : format
      return pipeline
        .clone()
        .resize(media.size)
        [method](options[media.format])
        .toBuffer()
        .then((buf) => {
          const copy = toVFile(file.path)

          copy.value = buf
          copy.stem += '-' + media.size
          copy.extname = '.' + media.format

          return copy
        })
    }
  }
}
