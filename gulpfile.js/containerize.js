const { series } = require('gulp')
const { spawner, setContainerName, tagRef} = require('./utils')

const container = async () => {
    setContainerName()
    console.log(`Composing images for: ${process.env.DOCKER_ORG}/${process.env.REPO_NAME} hash:${process.env.REPO_HASH}`)
    await spawner('docker-compose build')
}

const publish = async () => {
    await spawner('docker-compose push')
    tagRef(`${process.env.DOCKER_ORG}/${process.env.REPO_NAME}-${process.env.REPO_HASH}`, process.env.REPO_HASH)
}

const containerize = series(container, publish)

module.exports = {
    container, containerize, publish
}
