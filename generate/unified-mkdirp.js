/**
 * @typedef {import('hast').Root} Root
 * @typedef {import('vfile').VFile} VFile
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

/**
 * Plugin to make sure the directories to a file exist.
 */
export default function mkdir() {
  /**
   * @param {Root} _
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {Promise<void>}
   *   Nothing.
   */
  return async function (_, file) {
    assert(file.dirname, 'expected `dirname` on file')
    await fs.mkdir(file.dirname, {recursive: true})
  }
}
