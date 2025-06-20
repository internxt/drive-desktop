module.exports = {
  extends: ['@internxt/eslint-config-internxt', 'plugin:prettier/recommended', 'plugin:@tanstack/eslint-plugin-query/recommended'],
  plugins: ['import', 'unicorn', '@tanstack/query'],
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
    'padding-line-between-statements': [
      'warn',
      { blankLine: 'always', prev: '*', next: 'block' },
      { blankLine: 'always', prev: '*', next: 'class' },
      { blankLine: 'always', prev: '*', next: 'function' },
      { blankLine: 'always', prev: 'multiline-expression', next: 'multiline-expression' },
    ],
  },
  parser: '@typescript-eslint/parser',
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
