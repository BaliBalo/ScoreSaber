import eslint from '@eslint/js';
import globals from 'globals';
import stylistic from '@stylistic/eslint-plugin';

export default [
	{ ignores: ['**/*.min.js'] },
	eslint.configs.recommended,
	stylistic.configs.customize({
		indent: 'tab',
		jsx: false,
		semi: true,
		braceStyle: '1tbs',
		commaDangle: 'only-multiline'
	}),
	{
		rules: {
			'@stylistic/no-floating-decimal': 'off',
		},
	},
	{
		files: ['**/*.js', '**/*.mjs'],
		languageOptions: { globals: { ...globals.node } },
	},
	{
		files: ['pages/*.js'],
		languageOptions: { globals: { ...globals.browser } },
	},
];
