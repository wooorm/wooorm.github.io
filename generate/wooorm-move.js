/**
 * @typedef {import('hast').Root} Root
 */

import assert from 'node:assert/strict'
import path from 'node:path'

/**
 * Plugin that moves a file’s path to the output location
 *
 * @type {import('unified').Plugin<[], Root>}
 */
export default function move() {
  return function (_, file) {
    const {pathname} = file.data.meta || {}
    assert(pathname, 'expected `pathname` on metadata')
    const parts = pathname.slice(1).split(path.posix.sep)
    const last = parts.pop()

    parts.unshift('build')
    parts.push(last || 'index')

    file.path = parts.join(path.sep)
    file.extname = '.html'

    // Clean history.
    file.history = [file.path]
  }
}
