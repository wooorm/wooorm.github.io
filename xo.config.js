/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: true,
    rules: {
      'logical-assignment-operators': 'off',
      'no-await-in-loop': 'off',
      'no-restricted-globals': 'off',
      'prefer-destructuring': 'off',
      'promise/prefer-await-to-then': 'off',
      'promise/prefer-catch': 'off',
      'unicorn/prefer-at': 'off',
      'unicorn/prefer-string-replace-all': 'off'
    },
    space: true
  }
]

export default xoConfig
