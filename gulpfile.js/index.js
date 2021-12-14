module.exports = {
    ...require('./build'),
    ...require('./containerize'),
    ...require('./deploy'),
    ...require('./tests'),
    ...require('./utils'),
}
