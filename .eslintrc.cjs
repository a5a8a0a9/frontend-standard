module.exports = {
  root: true,
  env: { es2022: true, browser: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.eslint.json'],
    tsconfigRootDir: __dirname
  },
  plugins: ['@typescript-eslint', '@angular-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@angular-eslint/recommended',
    'plugin:@angular-eslint/template/process-inline-templates',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    'prefer-const': 'warn',
    'eqeqeq': ['error', 'smart'],
    'import/order': ['warn', {
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true }
    }],
    '@angular-eslint/component-class-suffix': ['error', { suffixes: ['Component'] }],
    '@angular-eslint/directive-class-suffix': ['error', { suffixes: ['Directive'] }]
  },
  overrides: [
    {
      files: ['*.html'],
      parser: '@angular-eslint/template-parser',
      extends: ['plugin:@angular-eslint/template/recommended'],
      rules: {}
    }
  ]
};
