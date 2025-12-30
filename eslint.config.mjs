import eslintConfig from '@electron-toolkit/eslint-config'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintConfigPrettierBase from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import eslintPluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: ['**/node_modules', '**/dist', '**/out']
  },
  eslintConfig,
  ...eslintPluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  eslintConfigPrettierBase,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        },
        extraFileExtensions: ['.vue']
      }
    }
  },
  {
    files: ['**/*.{js,jsx,vue}'],
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  }
]
