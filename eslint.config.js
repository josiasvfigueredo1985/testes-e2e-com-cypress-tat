const cypress = require('eslint-plugin-cypress')

module.exports = [
  {
    ignores: ['node_modules/**', 'cypress/screenshots/**', 'cypress/videos/**']
  },
  {
    ...cypress.configs.recommended,
    files: ['cypress/**/*.js']
  },
  {
    files: ['cypress/**/*.js', 'cypress.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        require: 'readonly',
        module: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      indent: ['error', 2],
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
      'no-trailing-spaces': 'error'
    }
  }
]
