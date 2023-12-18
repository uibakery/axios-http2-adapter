module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ],
    rules: {
        'prettier/prettier': 'error'
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
    },
};