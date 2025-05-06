module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.main.js'],
  testMatch: ['**/*.test.(ts|tsx|js)'],
  testPathIgnorePatterns: [
    '<rootDir>/release/',
    '<rootDir>/src/apps/renderer/'
  ],
  transform: {
    '^.+\\.(ts|tsx|js)$': ['ts-jest', { tsconfig: 'tsconfig.test.json', useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transformIgnorePatterns: ['node_modules/(?!axios|openapi-fetch)'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/release/'],
  moduleDirectories: ['node_modules', 'src'],
  modulePaths: ['<rootDir>/src'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
