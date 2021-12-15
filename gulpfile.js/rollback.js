// General Steps
const GulpError = require("plugin-error")
const {
    getGitHashForTag,
    getGitName,
    codeVersions,
    previousVersion
} = require("./utils")
const { series } = require("gulp")
const { postDeployTests } = require("./tests")
const { apply } = require("./apply")

const VALID_ENVIRONMENT_ARGS = ['develop', 'production']
const DEFAULT_ENVIRONMENT = 'develop'

const demote = async () => {

    const args = process.argv.slice(2) // remove first two elements
    const environment = VALID_ENVIRONMENT_ARGS.find(env => args.some(arg => env === arg.substring(2))) || DEFAULT_ENVIRONMENT
    if (!VALID_ENVIRONMENT_ARGS.some(env => env === environment)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid environment: --develop, or --production.'))
    }

    // look for the argument that is a number or that starts with 'v'
    let tag = args.find(arg => arg.startsWith('--v') || !isNaN(arg.substring(2)))
    if (!tag) {
        throw new GulpError('rollback', new Error('Error: git tag not found.'))
    }
    tag = tag.substring(2)
    // Get the environment to deploy to and the project in google that corresponds to this environment.
    if (tag[0] !== 'v') { // number of tags to roll back by, a number greator than 1
        const versions = codeVersions()
        tag = previousVersion(versions, tag)
    }
    if (!tag) {
        throw new GulpError('rollback', new Error('Error: git tag not found.'))
    }
    const hash = getGitHashForTag(tag)
    process.env.REPO_HASH = hash
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'

    console.log(`Rolling back to tag: ${tag} org/repo:hash --> \x1b[33m"${process.env.DOCKER_ORG}/${process.env.REPO_NAME}:${hash}"\x1b[0m into environment \x1b[33m"${environment}"\x1b[0m `)

    await apply(environment)
}

const rollback = series(demote, postDeployTests)

module.exports = {
    demote,
    rollback
}
