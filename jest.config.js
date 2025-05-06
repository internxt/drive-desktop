/* eslint-disable */
const isRenderer = process.env.TEST_ENV === 'renderer';

module.exports = isRenderer
  ? require('./jest.config.renderer')
  : require('./jest.config.main');
