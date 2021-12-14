const { series } = require('gulp')
const { postBuildTest } = require('./tests')
const { spawner } = require('./utils')

const uninstall = async () => {
    try {
        await spawner('yarn clean-all')
    }
    catch (error) {
        console.log("Warning: ", error)
    }
}

const clean = async () => {
    try {
        await spawner('yarn clean')
    }
    catch (error) {
        console.log("Warning: ", error)
    }
}

const install = async () => {
    await spawner('yarn install')
}

const compile = async () => {
    await spawner('yarn build')
}

const develop = async () => {
    await spawner('yarn develop')
}

const build = series(compile, postBuildTest)
const clean_build = series(clean, install, compile)
const scratchBuild = series(clean, uninstall, install, build, postBuildTest)

module.exports = {
    build, clean, compile, develop, install, scratchBuild, uninstall, clean_build
}