const { series } = require('gulp')
const { spawner, setContainerName, tagRef, containerTag, getGitHash, getGitName } = require('./utils')

const container = async () => {
    setContainerName()
    console.log(`Composing images for: ${containerTag()}`)
    await spawner('docker-compose build')
}

const publish = async () => {
    await spawner('docker-compose push')
    tagRef(containerTag(process.env.DOCKER_ORG, process.env.REPO_NAME, process.env.REPO_HASH), process.env.REPO_HASH)
}

const containerize = series(container, publish)

module.exports = {
    container, containerize, publish
}
