'use strict'

/* eslint-env browser */

var Finger = require('fingerprintjs2')

var patterns = [lines, dots, squares, crosses, cloth, zigzag]

var id = localStorage.i

if (id) {
  paint(id)
} else {
  new Finger({detectScreenOrientation: false}).get(onfingersuccess)
}

function next() {
  localStorage.t =
    (Number(localStorage.t) || 0) + Math.floor(Math.random() * 360)
  window.location.reload()
}

function onfingersuccess(id) {
  localStorage.i = id
  paint(id)
}

function paint(id) {
  var salt = Number(localStorage.t) || 0
  var int = Math.floor(parseInt(id, 16) / 1e31) + salt
  var hue = int % 360 || 0
  var hl = 'hsl(' + hue + ', 97%, 43%)'
  var bg = 'hsl(' + (hue - (int % 11 + 1) * 15) + ', 95%, 20%)'
  var fg = 'hsl(' + (hue + (int % 9 + 1) * 15) + ', 95%, 99%)'

  var style = document.createElement('style')
  var p = document.createElement('p')
  var small = document.createElement('small')
  var button = document.createElement('button')
  var code = document.createElement('code')

  style.appendChild(
    document.createTextNode(
      [
        'a, button { color: ' + hl + '; border-color: currentcolor }',
        'html { ' + patterns[int % patterns.length || 0](int, fg, bg) + ' }',
        'body { background-color: ' + fg + '; color: ' + bg + ' }',
        'figure::after {background: radial-gradient(circle, transparent, ' +
          bg +
          ')  }'
      ].join('\n')
    )
  )

  p.appendChild(small)
  small.appendChild(document.createTextNode('P.S. I made this site for you, '))
  small.appendChild(code)
  small.appendChild(document.createTextNode(', try a '))
  small.appendChild(button)
  code.appendChild(document.createTextNode(id.slice(0, 6)))
  button.appendChild(document.createTextNode('different design'))
  button.addEventListener('click', next)
  code.title = id + (salt ? '@' + salt.toString(16) : '')

  document.body.insertBefore(p, document.getElementsByTagName('p')[0])
  document.head.appendChild(style)
}

function lines(id, fg, bg) {
  var size = 4 + id % 180

  return [
    'background-color: ' + bg,
    'background-image: repeating-linear-gradient(' +
      (id % 4) * 45 +
      'deg, transparent, transparent ' +
      size +
      'px, ' +
      fg +
      ' ' +
      size +
      'px, ' +
      fg +
      ' ' +
      size * 2 +
      'px);'
  ].join(';')
}

function dots(id, fg, bg) {
  var size = 4 + id % 180

  return [
    'background-color: ' + bg,
    'background-image: ' +
      [
        'radial-gradient(' + fg + ' 15%, transparent 16%)',
        'radial-gradient(' + fg + ' 15%, transparent 16%)'
      ].join(', '),
    'background-size: ' + size * 2 + 'px ' + size * 2 + 'px',
    'background-position: 0 0, ' + size + 'px ' + size + 'px'
  ].join(';')
}

function squares(id, fg, bg) {
  var size = 4 + id % 180

  return [
    'background-color: ' + bg,
    'background-image: ' +
      [
        'linear-gradient(45deg, ' +
          fg +
          ' 25%, transparent 25%, transparent 75%, ' +
          fg +
          ' 75%, ' +
          fg +
          ')',
        'linear-gradient(45deg, ' +
          fg +
          ' 25%, transparent 25%, transparent 75%, ' +
          fg +
          ' 75%, ' +
          fg +
          ')'
      ].join(', '),
    'background-size: ' + size * 2 + 'px ' + size * 2 + 'px',
    'background-position: ' + ['0 0', size + 'px ' + size + 'px'].join(', ')
  ].join(';')
}

function crosses(id, fg, bg) {
  var size = 4 + id % 180
  var dbl = size * 2
  var secondary = Math.max(1, Math.floor(size / 25))
  var primary = secondary * 2

  return [
    'background: ' +
      [
        'radial-gradient(circle, transparent 20%, ' +
          bg +
          ' 20%, ' +
          bg +
          ' 80%, transparent 80%, transparent)',
        'radial-gradient(circle, transparent 20%, ' +
          bg +
          ' 20%, ' +
          bg +
          ' 80%, transparent 80%, transparent) ' +
          size +
          'px ' +
          size +
          'px',
        'linear-gradient(' +
          fg +
          ' ' +
          primary +
          'px, transparent ' +
          primary +
          'px) 0 -' +
          secondary +
          'px',
        'linear-gradient(90deg, ' +
          fg +
          ' ' +
          primary +
          'px, transparent ' +
          primary +
          'px) -' +
          secondary +
          'px 0'
      ].join(', '),
    'background-color: ' + bg,
    'background-size: ' +
      [
        dbl + 'px ' + dbl + 'px',
        dbl + 'px ' + dbl + 'px',
        size + 'px ' + size + 'px',
        size + 'px ' + size + 'px'
      ].join(', ')
  ].join(';')
}

function cloth(id, fg, bg) {
  var size = 4 + id % 180

  fg = fg.replace(/hsl/, 'hsla').replace(/\)/, ', 0.5)')

  return [
    'background-color: ' + bg,
    'background-image:' +
      [
        'linear-gradient(90deg, ' + fg + ' 50%, transparent 50%)',
        'linear-gradient(' + fg + ' 50%, transparent 50%)'
      ],
    'background-size: ' + size + 'px ' + size + 'px'
  ].join(';')
}

function zigzag(id, fg, bg) {
  var size = 1 + id % 180
  var dbl = size * 2

  fg = fg.replace(/hsl/, 'hsla').replace(/\)/, ', 0.5)')

  return [
    'background:' +
      [
        'linear-gradient(135deg, ' +
          fg +
          ' 25%, transparent 25%) -' +
          size +
          'px 0',
        'linear-gradient(225deg, ' +
          fg +
          ' 25%, transparent 25%) -' +
          size +
          'px 0',
        'linear-gradient(315deg, ' + fg + ' 25%, transparent 25%)',
        'linear-gradient(45deg, ' + fg + ' 25%, transparent 25%)'
      ],
    'background-color: ' + bg,
    'background-size: ' + dbl + 'px ' + dbl + 'px'
  ].join(';')
}
