const { series } = require('gulp')
const { spawner, getGitHash, getGitName, codeVersions, nextVersion } = require('./utils')

const container = async () => {
    process.env.REPO_HASH = getGitHash()
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'

    console.log(`Composing images for: ${process.env.DOCKER_ORG}/${process.env.REPO_NAME} hash:${process.env.REPO_HASH}`)
    await spawner('docker-compose build')
}

const publish = async () => {
    await spawner('docker-compose push')
}

const containerize = series(container, publish)

module.exports = {
    container, containerize, publish
}
