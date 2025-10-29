/* eslint-disable */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['jest-extended/all', '<rootDir>/jest.setup.renderer.js'],
  testMatch: ['**/*.test.(ts|tsx)'],
  transform: {
    '\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
    '\\.(js|jsx)$': ['ts-jest', { useESM: true }],
  },
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/.erb/mocks/fileMock.js',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  testURL: 'http://localhost/',
  transformIgnorePatterns: ['node_modules/(?!axios)'],
  modulePathIgnorePatterns: ['<rootDir>/release/'],
  moduleDirectories: ['node_modules', 'src'],
  modulePaths: ['<rootDir>/src'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
