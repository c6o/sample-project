const { series } = require('gulp')
const GulpError = require('plugin-error')
const {
    codeVersions,
    getGitHash,
    getGitName,
    lastVersion,
    nextVersion,
    getGitHashForTag,
    setGitUser,
    tagRef,
} = require('./utils')
const { postDeployTests } = require("./tests");
const { apply } = require("./apply");

const VALID_ENVIRONMENT_ARGS = ['develop', 'production']
const DEFAULT_ENVIRONMENT = 'develop'
const VALID_SEMVER_CHANGE_ARG = ['patch', 'minor', 'major']
const DEFAULT_SEMVER_CHANGE = 'patch'

// General Steps
const promote = async () => {

    const args = process.argv.slice(2) // remove first two elements
    // Get the environment to deploy to and the project in google that corresponds to this environment.
    const environment = VALID_ENVIRONMENT_ARGS.find(env => args.some(arg => env === arg.substring(2))) || DEFAULT_ENVIRONMENT
    if (!VALID_ENVIRONMENT_ARGS.some(env => env === environment)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid environment: --develop, or --production.'))
    }
    // for production deploy, a semver bump is needed.
    const semver = VALID_SEMVER_CHANGE_ARG.find(env => args.some(arg => env === arg.substring(2))) || DEFAULT_SEMVER_CHANGE
    if (!VALID_SEMVER_CHANGE_ARG.some(sem => sem === semver)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid semantic version increment: --patch, --minor or --major.'))
    }

    const hash = getGitHash()
    process.env.REPO_HASH = hash
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'

    console.log(`Deploying org/repo:hash --> \x1b[33m"${process.env.DOCKER_ORG}/${process.env.REPO_NAME}:${hash}"\x1b[0m into environment \x1b[33m"${environment}"\x1b[0m `)

    await apply(environment)

    // tag with a semantic version things that go to production
    if (environment === 'production') {
        // Update the repo semver tags for production.
        const versions = codeVersions()
        const last = lastVersion(versions)
        const lastHash = getGitHashForTag(last)
        console.log('lastHash: ', lastHash)
        console.log('last: ', last)
        console.log('process.env.REPO_HASH: ', process.env.REPO_HASH)
        if (lastHash !== process.env.REPO_HASH) {
            const version = nextVersion(versions, semver)
            console.log(`Bump Level: \x1b[33m${semver}\x1b[0m Version: \x1b[33m${version}\x1b[0m, Last Version: \x1b[33m${last}\x1b[0m`)
            await setGitUser()
            await tagRef(version, hash)
            // await pushTags()
        } else {
            console.log(`\x1b[35mA tag for hash ${process.env.REPO_HASH} already exists (${last}), skipping creating and tagging of a new version\x1b[0m`)
        }
    }
}

const deploy = series(promote, postDeployTests)

module.exports = {
    deploy,
    promote
}
