const { series } = require('gulp')
const GulpError = require('plugin-error')
const { writeFileSync } = require('fs')
const { dryRun, getGitHash, spawner, updateRef, lastVersion, nextVersion, codeVersions, tagRef, getGitName} = require('./utils')
const { postDeployTests } = require("./tests");

const ENVIRONMENT_ARG = 3
const SEMVER_CHANGE_ARG = 4
const VALID_ENVIRONMENT_ARGS = ['develop', 'production']
const DEFAULT_ENVIRONMENT = 'develop'
const VALID_SEMVER_CHANGE_ARG = ['patch', 'minor', 'major']
const DEFAULT_SEMVER_CHANGE = 'patch'

const POINTER_BRANCH_LOOKUP = {
    develop: 'develop',
    production: 'main',
}

// Provider specific and repo specific steps
const apply = async (environment) => {
    if (dryRun())
        console.log(`\x1b[1m\x1b[35mThis is a dry run\x1b[0m`)
    console.log(`\x1b[1m\x1b[33mApplying kubernetes resources\x1b[0m`)
    if (!process.env.KUBECONFIG) {
        throw new GulpError('apply', new Error('Error: A KUBECONFIG environment variable must be set that points to a vailid kubeconfig yaml'))
    }
    try {
        await spawner(`kubectl create ns ${environment}`)
    } finally {
        await spawner(`kubectl apply -f ./k8s -n ${environment}`)
    }
}

// General Steps
const promote = async () => {

    // Get the environment to deploy to and the project in google that corresponds to this environment.
    if (process.argv.length < ENVIRONMENT_ARG + 1) {
        throw new GulpError('promote', new Error('Error: task "deployContainer" requires the environment as an argument, specify --develop, --staging or --production.'))
    }
    const environment = process.argv[ENVIRONMENT_ARG].substring(2) || DEFAULT_ENVIRONMENT
    if (!VALID_ENVIRONMENT_ARGS.some(env => env === environment)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid environment: --develop, or --production.'))
    }
    // for production deploy, a semver bump is needed.
    let semver = process.argv[SEMVER_CHANGE_ARG] ? process.argv[SEMVER_CHANGE_ARG].substring(2) || DEFAULT_SEMVER_CHANGE : DEFAULT_SEMVER_CHANGE
    if (semver === 'dryrun'){
        semver = 'patch'
    }
    if (!VALID_SEMVER_CHANGE_ARG.some(sem => sem === semver)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid semantic version increment: --patch, --minor or --major.'))
    }

    const versions = codeVersions()
    const version = nextVersion(versions, semver)
    const last = lastVersion(versions)
    const branch = POINTER_BRANCH_LOOKUP[environment]
    const hash = getGitHash()

    process.env.REPO_HASH = hash
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'

    console.log(`Deploying org/repo:hash --> \x1b[33m"${process.env.DOCKER_ORG}/${process.env.REPO_NAME}:${hash}"\x1b[0m into environment \x1b[33m"${environment}"\x1b[0m `)
    console.log(`Bump Level: \x1b[33m${semver}\x1b[0m Version: \x1b[33m${version}\x1b[0m, Last Version: \x1b[33m${last}\x1b[0m, Pointer branch: \x1b[33m${branch}\x1b[0m`)

    await apply(environment)

    if (branch) {
        await updateRef(branch)
    }
    if (environment === 'production') {
        await tagRef(version)
    }
}

const deploy = series(promote, postDeployTests)

module.exports = {
    deploy,
    promote
}
