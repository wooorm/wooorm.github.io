'use strict';

/* eslint-env browser */

var Finger = require('fingerprintjs2');

new Finger({detectScreenOrientation: false}).get(onfingersuccess);

var patterns = [
  lines,
  dots,
  squares
];

function onfingersuccess(id) {
  var int = parseInt(id, 16);
  var hue = int % 360 || 0;
  var hl = 'hsl(' + hue + ', 97%, 43%)';
  var bg = 'hsl(' + (hue - 45) + ', 95%, 20%)';
  var fg = 'hsl(' + (hue + 45) + ', 95%, 99%)';

  document.body
    .appendChild(document.createElement('hr'));

  document.body
    .appendChild(document.createElement('p'))
    .textContent = 'P.S. I made this site for you, ' + id + '.';

  document.head
    .appendChild(document.createElement('style'))
    .textContent = [
      'a { color: ' + hl + ' }',
      'html { ' + patterns[(int % patterns.length) || 0](int, fg, bg) + ' }',
      'body { background-color: ' + fg + '; color: ' + bg + ' }'
    ].join('\n');
}

function lines(id, fg, bg) {
  var size = (10 + ((id % 4) * 10)) / 2;

  return [
    'background-color: ' + bg,
    'background-image: repeating-linear-gradient(' + ((id % 4) * 45) + 'deg, transparent, transparent ' + size + 'px, ' + fg + ' ' + size + 'px, ' + fg + ' ' + (size * 2) + 'px);'
  ].join(';');
}

function dots(id, fg, bg) {
  var size = ((id % 8) + 1) * 15;

  return [
    'background-color: ' + bg,
    'background-image: ' + [
      'radial-gradient(' + fg + ' 15%, transparent 16%)',
      'radial-gradient(' + fg + ' 15%, transparent 16%)'
    ].join(', '),
    'background-size: ' + (size * 2) + 'px ' + (size * 2) + 'px',
    'background-position: 0 0, ' + size + 'px ' + size + 'px'
  ].join(';');
}

function squares(id, fg, bg) {
  var size = ((id % 3) + 1) * 15;

  return [
    'background-color: ' + bg,
    'background-image: ' + [
      'linear-gradient(45deg, ' + fg + ' 25%, transparent 25%, transparent 75%, ' + fg + ' 75%, ' + fg + ')',
      'linear-gradient(45deg, ' + fg + ' 25%, transparent 25%, transparent 75%, ' + fg + ' 75%, ' + fg + ')'
    ].join(', '),
    'background-size: ' + (size * 2) + 'px ' + (size * 2) + 'px',
    'background-position: 0 0, ' + size + 'px ' + size + 'px'
  ].join(';');
}
