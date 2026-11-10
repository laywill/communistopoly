// Copyright © 2025 William Lay
// Licensed under the PolyForm Noncommercial License 1.0.0

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    ignores: ['dist/', '.vite/', 'node_modules/', 'megalinter-reports/', 'eslint.config.js', 'coverage/']
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true
      }
    },
    plugins: {
      'react-hooks': pluginReactHooks
    },
    settings: {
      react: {
        // Pinned rather than 'detect': eslint-plugin-react 7.37.x's version
        // detection calls context.getFilename(), which ESLint 10 removed.
        // Restore 'detect' once the plugin ships ESLint 10 support, and drop
        // the matching "eslint-plugin-react" entry in package.json overrides.
        version: '19.3'
      }
    }
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  pluginReact.configs.flat.recommended, // This is not a plugin object, but a shareable config object
  pluginReact.configs.flat['jsx-runtime'], // Add this if you are using React 17+
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
])
