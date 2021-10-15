//export default {
// eslint-disable-next-line no-undef
module.exports = {
    projects: [
        '<rootDir>/sample-project-server/jest.config.unittest.js',
        '<rootDir>/sample-project-sockets/jest.config.unittest.js',
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