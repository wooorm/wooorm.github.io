/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 *
 * @typedef {'webp'|'jpg'|'png'} Format
 *
 * @typedef Options
 * @property {string} base
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs/promises'
import {toVFile} from 'to-vfile'
import sharp from 'sharp'
import {rename} from 'vfile-rename'
import {visitParents} from 'unist-util-visit-parents'
import {h} from 'hastscript'
import {matches} from 'hast-util-select'
import {classnames} from 'hast-util-classnames'

/**
 * Plugin to defer scripts.
 *
 * @type {import('unified').Plugin<[Options], Root>}
 */
export default function rehypePictures(options) {
  const sizes = [600, 1200, 2400, 3600]
  /** @type {Array<Format>} */
  const formats = ['webp', 'png', 'jpg']
  /** @type {{[format in Format]: string}} */
  const mimes = {webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg'}
  const base = options.base
  const sources = formats.flatMap((format) =>
    sizes.flatMap((size) => ({
      stem: {suffix: '-' + size},
      extname: '.' + format
    }))
  )

  return async function (tree) {
    /** @type {Array<Promise<void>>} */
    const promises = []

    visitParents(tree, 'element', visitor)

    if (promises.length > 0) {
      await Promise.all(promises)
    }

    /** @type {import('unist-util-visit-parents/complex-types.js').BuildVisitor<Root, Element>} */
    function visitor(node, parents) {
      const src = (node.tagName === 'img' && node.properties?.src) || ''

      if (typeof src !== 'string' || src.charAt(0) !== '/') {
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
      promises.push(rewrite(src, node, parent, root))

      /**
       * @param {string} src
       * @param {Element} node
       * @param {Element} parent
       * @param {Element} root
       */
      async function rewrite(src, node, parent, root) {
        assert(node.properties, 'expected properties on `img`')
        const resolved = path.join(base, src.split('/').join(path.sep))

        // See dimension.
        const metadata = await sharp(resolved)
          .metadata()
          .catch(() => {
            throw new Error('Could not find `' + resolved + '`')
          })
        assert(metadata.width, 'expected intrinsic `width` of image')
        assert(metadata.height, 'expected intrinsic `height` of image')

        const results = await Promise.all(
          sources.map(async (d) => {
            const fp = rename(toVFile({path: resolved}), d).path

            return fs.access(fp, fs.constants.R_OK).then(
              () => fp,
              () => {}
            )
          })
        )

        const defaults = new Set(['png', 'jpg'])
        const available = new Set(results.filter(Boolean))
        const siblings = parent.children
        let width = metadata.width
        let height = metadata.height
        let biggestDefault

        // Generate the sources, but only if they exist.
        const srcs = formats.flatMap((format) => {
          const applicable = sizes
            .flatMap(
              /**
               * @returns {Array<[string, number]>}
               */
              (size) => {
                const fp = rename(toVFile({path: resolved}), {
                  stem: {suffix: '-' + size},
                  extname: '.' + format
                }).path

                return available.has(fp) ? [[fp, size]] : []
              }
            )
            .sort((a, b) => a[1] - b[1])

          if (applicable.length === 0) {
            return []
          }

          if (defaults.has(format)) {
            biggestDefault = applicable[applicable.length - 1]
          }

          return h('source', {
            srcSet: applicable
              .map((d) => ['/' + path.relative(base, d[0])] + ' ' + d[1] + 'w')
              .join(','),
            type: mimes[format]
          })
        })

        if (biggestDefault) {
          node.properties.src = path.relative(base, biggestDefault[0])
          width = biggestDefault[1]
          height = (width / metadata.width) * metadata.height
        }

        node.properties.loading = 'lazy'
        node.properties.decoding = 'async'
        node.properties.width = width
        node.properties.height = height

        if (width / height > 2) {
          classnames(root, 'panorama')
        } else if (width / height > 1) {
          classnames(root, 'landscape')
        }

        siblings[siblings.indexOf(node)] = h('picture', srcs.concat(node))
      }
    }
  }
}
