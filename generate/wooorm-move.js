import path from 'path'

// Plugin that moves a file’s path to the output location
export default function move() {
  return transform
  function transform(_, file) {
    const {pathname} = file.data.meta
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
