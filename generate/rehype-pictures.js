/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 */

/**
 * @typedef {'jpg' | 'png' | 'webp'} Format
 *   Image format.
 *
 * @typedef Options
 *   Configuration.
 * @property {string} base
 *   Base folder.
 *
 * @typedef {[filePath: string, size: number]} InfoTuple
 *   Size.
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {h} from 'hastscript'
import {classnames} from 'hast-util-classnames'
import {matches} from 'hast-util-select'
import {toVFile} from 'to-vfile'
import {visitParents} from 'unist-util-visit-parents'
import {rename} from 'vfile-rename'

/**
 * Plugin to defer scripts.
 *
 * @param {Readonly<Options>} options
 *   Configuration.
 * @returns
 *   Transform.
 */
export default function rehypePictures(options) {
  const sizes = [600, 1200, 2400, 3600]
  /** @type {ReadonlyArray<Readonly<Format>>} */
  const formats = ['jpg', 'png', 'webp']
  /** @type {{[format in Format]: string}} */
  const mimes = {jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp'}
  const base = options.base

  const sources = formats.flatMap(function (format) {
    return sizes.flatMap(function (size) {
      return {
        extname: '.' + format,
        stem: {suffix: '-' + size}
      }
    })
  })

  /**
   * @param {Root} tree
   *   Tree.
   * @returns {Promise<void>}
   *   Nothing.
   */
  return async function (tree) {
    /** @type {Array<Promise<undefined>>} */
    const promises = []

    visitParents(tree, 'element', visitor)

    if (promises.length > 0) {
      await Promise.all(promises)
    }

    /** @type {import('unist-util-visit-parents').BuildVisitor<Root, 'element'>} */
    function visitor(node, parents) {
      const source = (node.tagName === 'img' && node.properties.src) || ''

      if (typeof source !== 'string' || source.charAt(0) !== '/') {
        return
      }

      let index = parents.length - 1
      const parent = parents[index]
      let root = parent

      while (index--) {
        const ancestor = parents[index]
        if (matches('.picture-root', ancestor)) {
          root = ancestor
          break
        }
      }

      assert(parent.type === 'element', 'expected image parent')
      assert(root.type === 'element', 'expected image root')
      promises.push(rewrite(source, node, parent, root))

      /**
       * @param {string} source
       *   Source.
       * @param {Element} node
       *   Node.
       * @param {Element} parent
       *   Parent.
       * @param {Element} root
       *   Root.
       * @returns {Promise<undefined>}
       *   Nothing.
       */
      async function rewrite(source, node, parent, root) {
        assert(node.properties, 'expected properties on `img`')
        const resolved = path.join(base, source.split('/').join(path.sep))

        // See dimension.
        const metadata = await sharp(resolved)
          .metadata()
          .catch(function () {
            throw new Error('Could not find `' + resolved + '`')
          })
        assert(metadata.width, 'expected intrinsic `width` of image')
        assert(metadata.height, 'expected intrinsic `height` of image')

        const results = await Promise.all(
          sources.map(async function (d) {
            const file = toVFile({path: resolved})
            rename(file, d)
            const fp = file.path

            return fs.access(fp, fs.constants.R_OK).then(
              function () {
                return fp
              },
              function () {}
            )
          })
        )

        const defaults = new Set(['png', 'jpg'])
        const available = new Set(results.filter(Boolean))
        const siblings = parent.children
        let width = metadata.width
        let height = metadata.height
        /** @type {Readonly<InfoTuple> | undefined} */
        let biggestDefault

        // Generate the sources, but only if they exist.
        const srcs = formats.flatMap(function (format) {
          const applicable = sizes
            .flatMap(
              /**
               * @returns {ReadonlyArray<Readonly<InfoTuple>>}
               *   Sizes.
               */
              function (size) {
                const file = toVFile({path: resolved})
                rename(file, {
                  extname: '.' + format,
                  stem: {suffix: '-' + size}
                })
                const fp = file.path

                return available.has(fp) ? [[fp, size]] : []
              }
            )
            .sort(function (a, b) {
              return a[1] - b[1]
            })

          if (applicable.length === 0) {
            return []
          }

          if (defaults.has(format)) {
            biggestDefault = applicable[applicable.length - 1]
          }

          return h('source', {
            srcSet: applicable
              .map(function (d) {
                return ['/' + path.relative(base, d[0])] + ' ' + d[1] + 'w'
              })
              .join(','),
            type: mimes[format]
          })
        })

        if (biggestDefault) {
          node.properties.src = path.relative(base, biggestDefault[0])
          width = biggestDefault[1]
          height = (width / metadata.width) * metadata.height
        }

        node.properties.decoding = 'async'
        node.properties.height = height
        node.properties.loading = 'lazy'
        node.properties.width = width

        if (width / height > 2) {
          classnames(root, 'panorama')
        } else if (width / height > 1) {
          classnames(root, 'landscape')
        }

        const position = siblings.indexOf(node)
        siblings[position] = h('picture', [...srcs, node])
      }
    }
  }
}
