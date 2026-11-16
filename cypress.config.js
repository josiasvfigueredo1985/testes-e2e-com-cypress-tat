const { defineConfig } = require('cypress')
const { plugin: cypressGrepPlugin } = require('@cypress/grep/plugin')

module.exports = defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 30000,
  viewportWidth: 1280,
  viewportHeight: 720,
  video: true,
  expose: {
    viewportWidthBreakpoint: 768
  },
  e2e: {
    baseUrl: 'https://notes-serverless-app.com',
    specPattern: 'cypress/integration/**/*.spec.js',
    supportFile: 'cypress/support/index.js',
    setupNodeEvents(_on, config) {
      cypressGrepPlugin(config)
      return config
    }
  }
})
