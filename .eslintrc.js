module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true, // Add Jest environment
  },
  parser: '@babel/eslint-parser',
  plugins: ['react'],
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    // Fix: avoid requiring a project-level Babel config
    requireConfigFile: false,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
  },
};
