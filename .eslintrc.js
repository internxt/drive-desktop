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
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/no-floating-promises': 'warn',
    'array-callback-return': 'warn',
    'max-len': ['error', { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'no-async-promise-executor': 'warn',
    'no-await-in-loop': 'off',
    'no-empty': 'off',
    'no-use-before-define': 'warn',
    'object-shorthand': 'error',
    'require-await': 'warn',
  },
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
