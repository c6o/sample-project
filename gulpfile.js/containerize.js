const { series } = require('gulp')
const { spawner, setContainerName } = require('./utils')

const container = async () => {
    setContainerName()
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
