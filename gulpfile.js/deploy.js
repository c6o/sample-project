const { series } = require('gulp')
const GulpError = require('plugin-error')
const { writeFileSync } = require('fs')
const { dryRun, getGitHash, spawner, updateRef, lastVersion, nextVersion, codeVersions, tagRef, getGitName,
    onBuildServer
} = require('./utils')
const { postDeployTests } = require("./tests");

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

    // Authentication
    let kubectlArgs
    if (onBuildServer()) {
        if (!process.env.KUBECONFIG_CERT_AUTH_DATA || !process.env.KUBECONFIG_SERVER || !process.env.KUBECONFIG_USER_TOKEN) {
            throw new GulpError('apply', new Error('Error: Three environment variables are required for build server deployments from a valid kubeconfig.yaml file:\n' +
                'KUBECONFIG_CERT_AUTH_DATA (from clusters:- cluster: certificate-authority-data:),\n' +
                'KUBECONFIG_SERVER (from clusters:- cluster: server:), and \n' +
                'KUBECONFIG_USER_TOKEN (from users: user: token:)'))
        }
        kubectlArgs = `--server ${process.env.KUBECONFIG_SERVER} --token ${process.env.KUBECONFIG_USER_TOKEN} --client-key 'ca_file.cert' --insecure-skip-tls-verify`
        writeFileSync(`${process.env.HOME}/ca_file.cert`, process.env.KUBECONFIG_CERT_AUTH_DATA)
    } else {
        if (!process.env.KUBECONFIG) {
            throw new GulpError('apply', new Error('Error: A KUBECONFIG environment variable must be set that points to a vailid kubeconfig yaml file.'))
        }
        kubectlArgs = `--kubeconfig ${process.env.KUBECONFIG}`
    }

    // create a namespace and deploy the containers to the cluster.
    try {
        await spawner(`kubectl create ns ${environment} ${kubectlArgs}`, true)
    } finally {
        await spawner(`kubectl apply -f ./k8s -n ${environment} ${kubectlArgs}`)
    }
}

// General Steps
const promote = async () => {

    const args = process.argv.slice(2) // remove first two elements
    // Get the environment to deploy to and the project in google that corresponds to this environment.
    const environment = args.find(arg => VALID_ENVIRONMENT_ARGS.some(env => env === arg)) || DEFAULT_ENVIRONMENT
    if (!VALID_ENVIRONMENT_ARGS.some(env => env === environment)) {
        throw new GulpError('promote', new Error('Error: argument there must be a valid environment: --develop, or --production.'))
    }
    // for production deploy, a semver bump is needed.
    const semver = args.find(arg => VALID_SEMVER_CHANGE_ARG.some(env => env === arg)) || DEFAULT_SEMVER_CHANGE
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
