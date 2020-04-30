'use strict'

var mkdirp = require('vfile-mkdirp')

module.exports = mkdir

// Unified plugin to make sure the directories to a file exist.
function mkdir() {
  return transformer
  function transformer(_, file) {
    return mkdirp(file).then(() => {})
  }
}
