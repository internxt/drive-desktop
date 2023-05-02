module.exports = {
  extends: ['@internxt/eslint-config-internxt'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: ['./tsconfig.json'],
      },
      env: {
        jest: true,
      },
    },
  ],
  rules: {
    'no-await-in-loop': 'warn',
    'no-use-before-define': 'warn',
    'array-callback-return': 'warn',
    'max-len': [
      'error',
      {
        code: 120,
        ignorePattern: '^it',
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'warn',
    'no-async-promise-executor': 'warn',
  },
  parser: '@typescript-eslint/parser',
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
