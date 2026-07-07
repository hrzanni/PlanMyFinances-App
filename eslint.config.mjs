import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  { ignores: ['**/dist/**', '**/.next/**', '**/.expo/**', '**/coverage/**', '**/drizzle/**'] },
)
