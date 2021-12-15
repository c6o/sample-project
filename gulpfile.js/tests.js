const { series, parallel } = require('gulp')
const { onBuildServer, spawner } = require('./utils')

const unitTests = async () => {
    await spawner('yarn unit-tests')
}

const uiTests = async () => {
    if (onBuildServer())
        await spawner('xvfb-run --auto-servernum yarn ui-tests')
    else
        await spawner('yarn ui-tests')
}

const functionalTests = async () => {
    await spawner('yarn functional-tests')
}

const integrationTests = async () => {
    await spawner('yarn integration-tests')
}

const smokeTests = async () => {
    await spawner('yarn smoke-tests')
}

// Build tests
const parallelTests1 = parallel(unitTests, integrationTests)
const parallelTests2 = parallel(functionalTests, uiTests)
const postBuildTest = series(parallelTests1, parallelTests2)

// Container Tests
const postContainerizeTests = async () => {
    console.log("No post-container tests")
}

// Deploy Tests
// If any tests are added to the postDeployTests, make sure to update the dependencies in the gulpfile.js/package.json file.
// TODO: add dependencies to gulpfile.js/package.json if the tests require dependencies
const postDeployTests = parallel(smokeTests)

const test = series(postBuildTest, postContainerizeTests, postDeployTests)

module.exports = {
    functionalTests,
    integrationTests,
    postBuildTest,
    postContainerizeTests,
    postDeployTests,
    smokeTests,
    test,
    unitTests,
    uiTests,
}
