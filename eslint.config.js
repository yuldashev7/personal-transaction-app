const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'src/database/migrations/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]);
