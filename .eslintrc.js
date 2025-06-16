module.exports = {
  extends: ['@internxt/eslint-config-internxt', 'plugin:prettier/recommended'],
  plugins: ['import', 'unicorn'],
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
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-unused-expressions': 'error',
    'array-callback-return': 'warn',
    'import/no-default-export': 'warn',
    'max-len': ['error', { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'no-async-promise-executor': 'warn',
    'no-await-in-loop': 'off',
    'no-empty': 'off',
    'no-throw-literal': 'error',
    'no-unused-expressions': 'off',
    'no-use-before-define': 'warn',
    'object-shorthand': 'error',
    'require-await': 'warn',
    'unicorn/filename-case': ['warn', { case: 'kebabCase' }],
  },
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
