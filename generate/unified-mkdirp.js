/**
 * @typedef {import('hast').Root} Root
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

/**
 * Plugin to make sure the directories to a file exist.
 *
 * @type {import('unified').Plugin<[], Root>}
 */
export default function mkdir() {
  return async function (_, file) {
    assert(file.dirname, 'expected `dirname` on file')
    await fs.mkdir(file.dirname, {recursive: true})
  }
}
