//export default {
// eslint-disable-next-line no-undef
module.exports = {
    projects: [
        '<rootDir>/halyard-backend/jest.config.unittest.js',
    ],
    'reporters': [
        'default',
        ['jest-html-reporters', {
            'publicPath': './coverage',
            'filename': 'report.html',
            'expand': true,
        }],
    ],
    setupFiles: ['<rootDir>/jestsetup.js'],
}