// Jest configuration for integration tests
// eslint-disable-next-line no-undef
module.exports = {
    'testMatch': [
        '**/?(*.)+(test).+(js)'
    ],
    setupFiles: ['<rootDir>/jestsetup.js'],
    testEnvironment: 'node',
}