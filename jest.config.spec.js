// Jest configuration for functional tests
// eslint-disable-next-line no-undef
module.exports = {
    'testMatch': [
        '**/?(*.)+(spec).+(js)'
    ],
    setupFiles: ['<rootDir>/jestsetup.js'],
    testEnvironment: 'node',
    "testPathIgnorePatterns" : [
        "<rootDir>/jest.config.spec.js"
    ]
}