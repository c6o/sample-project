module.exports = {
    root: true,
    parser: 'esprima',
    extends: [
        'eslint:recommended',
    ],
    rules: {
        "camelcase": [1, { "properties": "always" }],
        "no-alert": 1,
        "no-console": 1,
        "no-trailing-spaces": [1, { "skipBlankLines": true }],
        "no-multi-spaces": 0,
        "prefer-const": 1,
        "quotes": [1, "single", "avoid-escape"],
        "semi": [2, "never"],
    },
  }