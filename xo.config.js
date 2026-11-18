/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      curly: 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/informative-docs': 'off',
      // Some tools only see JSX pragmas in `/* */` comments.
      'jsdoc/no-bad-blocks': ['error', {ignore: ['jsx', 'jsxFrag']}],
      'jsdoc/require-asterisk-prefix': 'off',
      // Wrong for inferred return types.
      'jsdoc/require-returns-type': 'off',
      'no-await-in-loop': 'off',
      'no-restricted-globals': 'off',
      'no-shadow': 'off',
      // Asserts are used to narrow types.
      'node-test/prefer-equality-assertion': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-destructuring': 'off',
      'regexp/no-super-linear-move': 'off',
      'regexp/prefer-named-capture-group': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      'unicorn/prefer-string-replace-all': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  // Wrong.
  {ignores: ['**/*.md', 'asset/*.html']},
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      'package-json/prefer-side-effects-field': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-properties': 'off',
      'package-json/valid-fields': 'off'
    }
  }
]

export default xoConfig
