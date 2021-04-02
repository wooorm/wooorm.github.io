import mkdirp from 'vfile-mkdirp'

// Unified plugin to make sure the directories to a file exist.
export default function mkdir() {
  return transformer
  function transformer(_, file) {
    return mkdirp(file).then(() => {})
  }
}
