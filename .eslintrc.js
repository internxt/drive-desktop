module.exports = {
  extends: ['@internxt/eslint-config-internxt'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['tsconfig.json'],
      },
    },
  ],
  rules: {
    'no-await-in-loop': 'warn',
    'no-use-before-define': 'warn',
    'array-callback-return': 'warn',
    'no-empty': 'off',
    'max-len': [
      'error',
      {
        code: 140,
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
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
