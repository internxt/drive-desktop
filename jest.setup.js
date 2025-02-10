if (process.env.TEST_ENV !== 'node') {
  // Set up Node environment for TS tests
  module.exports = {
    testEnvironment: 'node',
  };
}
