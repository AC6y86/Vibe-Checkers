/**
 * Jest configuration for Checkers Web App
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test directories
  roots: ['<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Puppeteer integration tests timeout
  testTimeout: 10000,

  // ES Modules support
  transform: {}
};
