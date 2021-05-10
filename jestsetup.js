/* eslint-disable no-undef */
process.on('unhandledRejection', (err) => {
    fail(err)
})