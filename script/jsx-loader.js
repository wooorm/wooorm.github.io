import {promises as fs} from 'node:fs'
import path from 'node:path'
import {URL, fileURLToPath} from 'node:url'
import {transform} from 'esbuild'

const {load} = createLoader()

export {load}

/**
 * A tiny JSX loader.
 */
export function createLoader() {
  return {load}

  /**
   * @param {string} url
   * @param {unknown} context
   * @param {Function} defaultLoad
   */
  async function load(url, context, defaultLoad) {
    if (path.extname(url) !== '.jsx') {
      return defaultLoad(url, context, defaultLoad)
    }

    const fp = fileURLToPath(new URL(url))
    const value = await fs.readFile(fp)

    const {code, warnings} = await transform(String(value), {
      sourcefile: fp,
      sourcemap: 'both',
      loader: 'jsx',
      target: 'esnext',
      format: 'esm'
    })

    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        console.log(warning.location)
        console.log(warning.text)
      }
    }

    return {format: 'module', source: code, shortCircuit: true}
  }
}
