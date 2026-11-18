import fs from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {transform} from 'esbuild'

const {load} = createLoader()

export {load}

/**
 * A tiny JSX loader.
 */
export function createLoader() {
  return {load}

  /**
   * Load a file, compiling JSX.
   *
   * @param {string} href
   *   URL.
   * @param {unknown} context
   *   Context.
   * @param {(href: string, context: unknown, defaultLoad: unknown) => unknown} defaultLoad
   *   Default `load`.
   * @returns
   *   Result.
   */
  async function load(href, context, defaultLoad) {
    const url = new URL(href)

    if (!url.pathname.endsWith('.jsx')) {
      return defaultLoad(href, context, defaultLoad)
    }

    const {code, warnings} = await transform(String(await fs.readFile(url)), {
      format: 'esm',
      loader: 'jsx',
      sourcefile: fileURLToPath(url),
      sourcemap: 'both',
      target: 'esnext'
    })

    if (warnings) {
      for (const warning of warnings) {
        console.log(warning.location)
        console.log(warning.text)
      }
    }

    return {format: 'module', shortCircuit: true, source: code}
  }
}
