module.exports = {
  extends: 'erb',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'error',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
    'global-require': 'off',
    'react/require-default-props': 'off',
    'no-nested-ternary': 'off',
    'no-restricted-syntax': 'off',
    'promise/catch-or-return': 'off',
    'import/prefer-default-export': 'off',
    'class-methods-use-this': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-loop-func': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'no-await-in-loop': 'off',
    'no-bitwise': 'off',
    'max-classes-per-file': 'off',
    'import/no-cycle': 'off',
    'consistent-return': 'off',
    'no-plusplus': 'off',
    'promise/always-return': 'off',
    'no-else-return': 'off',
    'no-async-promise-executor': 'off',
    'react/jsx-no-bind': 'off',
    'react/jsx-props-no-spreading': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
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
