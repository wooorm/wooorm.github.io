'use strict';

var vfile = require('to-vfile');
var report = require('vfile-reporter');
var select = require('hast-util-select').select;
var unified = require('unified');
var markdown = require('remark-parse');
var style = require('remark-preset-wooorm');
var links = require('remark-validate-links');
var remark2rehype = require('remark-rehype');
var doc = require('rehype-document');
var min = require('rehype-preset-minify');
var favicon = require('rehype-prevent-favicon-request');
var html = require('rehype-stringify');
var pack = require('./package.json');

unified()
  .use(markdown)
  .use(style)
  .use(links, false)
  .use(remark2rehype)
  .use(doc, {
    title: pack.name,
    css: 'index.css',
    js: 'index.js'
  })
  .use(nojs)
  .use(min)
  .use(favicon)
  .use(html)
  .process(vfile.readSync('readme.md'), function (err, file) {
    console.error(report(err || file));
    if (file) {
      file.dirname = 'static';
      file.basename = 'index.html';
      vfile.writeSync(file);
    }
  });

function nojs() {
  var script = 'document.body.className = \'\'; document.body.removeChild(document.currentScript)';
  return transformer;
  function transformer(tree) {
    var body = select('body', tree);
    var props = body.properties;

    if (!('className' in props)) {
      props.className = [];
    }

    props.className.push('nojs');

    body.children.unshift({
      type: 'element',
      tagName: 'script',
      properties: {},
      children: [{type: 'text', value: script}]
    });
  }
}
