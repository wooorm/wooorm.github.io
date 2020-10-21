'use strict'

var path = require('path')
var fs = require('fs')
var vfile = require('to-vfile')
var sharp = require('sharp')
var rename = require('vfile-rename')
var visit = require('unist-util-visit')
var h = require('hastscript')

module.exports = pictures

function pictures(options) {
  var sizes = [600, 1200, 2400, 3600]
  var formats = ['webp', 'png', 'jpg']
  var mimes = {webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg'}
  var base = options.base
  var sources = formats.flatMap((format) =>
    sizes.flatMap((size) => ({
      stem: {suffix: '-' + size},
      extname: '.' + format
    }))
  )

  return transform

  function transform(tree) {
    var promises = []

    visit(tree, 'element', visitor)

    if (promises.length > 0) {
      return Promise.all(promises).then(() => {})
    }

    function visitor(node, _, parent) {
      var src = (node.tagName === 'img' && node.properties.src) || ''

      if (!src || src.charAt(0) !== '/') {
        return
      }

      promises.push(rewrite(src, node, parent))

      function rewrite(src, node, parent) {
        var resolved = path.join(base, src.split('/').join(path.sep))
        var promises = [].concat(
          // See which images exist.
          sources.map((d) => {
            var fp = rename(vfile({path: resolved}), d).path

            return fs.promises.access(fp, fs.constants.R_OK).then(
              () => fp,
              () => {}
            )
          }),
          // See dimension.
          sharp(resolved).metadata()
        )

        return Promise.all(promises).then((result) => {
          var defaults = ['png', 'jpg']
          var info = result.pop()
          var available = result.filter(Boolean)
          var biggestDefault

          // Generate the sources, but only if they exist.
          var srcs = formats.flatMap((format) => {
            var applicable = sizes
              .map((size) => {
                var fp = rename(vfile({path: resolved}), {
                  stem: {suffix: '-' + size},
                  extname: '.' + format
                }).path

                return available.includes(fp) ? [fp, size] : []
              })
              .sort((a, b) => a[1] - b[1])
              .filter((d) => d.length !== 0)

            if (applicable.length === 0) {
              return []
            }

            if (defaults.includes(format)) {
              biggestDefault = applicable[applicable.length - 1]
            }

            return h('source', {
              srcSet: applicable.map(
                (d) => ['/' + path.relative(base, d[0])] + ' ' + d[1] + 'w'
              ),
              type: mimes[format]
            })
          })

          var siblings = parent.children
          var width = info.width
          var height = info.height

          node.properties.loading = 'lazy'

          if (biggestDefault) {
            node.properties.src = path.relative(base, biggestDefault[0])
            width = biggestDefault[1]
            height = (width / info.width) * info.height
          } else {
            width = info.width
            node.properties.height = info.height
          }

          node.properties.width = width
          node.properties.height = height

          siblings[siblings.indexOf(node)] = h(
            'picture',
            {style: 'max-width:' + width + 'px'},
            srcs.concat(node)
          )
        })
      }
    }
  }
}