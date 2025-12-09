/**
 * Jest setup file
 * Runs before all tests
 */

// Setup global test utilities
global.console = {
  ...console,
  // Suppress console logs during tests (optional)
  // Uncomment the line below to silence logs during testing
  // log: jest.fn(),
};

// Add custom matchers or global test setup here
beforeAll(() => {
  // Setup that runs once before all tests
});

afterAll(() => {
  // Cleanup that runs once after all tests
});
