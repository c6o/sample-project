module.exports = {
    ...require('./apply'),
    ...require('./build'),
    ...require('./containerize'),
    ...require('./deploy'),
    ...require('./rollback'),
    ...require('./tests'),
    ...require('./utils'),
}
