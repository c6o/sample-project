const { series } = require('gulp')
const GulpError = require('plugin-error')
const { writeFileSync } = require('fs')
const {
    codeVersions,
    dryRun,
    getDeploymentName,
    getGitHash,
    getGitName,
    getImageName,
    lastVersion,
    nextVersion,
    onBuildServer,
    setContainerName,
    spawner,
    tagRef,
    updateRef,
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
const ZONE = process.env.ORGANIZATION_ZONE || 'us-central1-c'
const PROJECT_LOOKUP = {
    develop: process.env.DEVELOP_PROJECT || 'traxitt-development',
    production: process.env.PRODUCTION_PROJECT || 'c6o-production',
}
const DEPLOYMENTS = ['core', 'frontend', 'leaf', 'sockets']

const setImages = async (environment, kubectlArgs) => {
    const result = await spawner(`kubectl create ns ${environment} ${kubectlArgs}`, true)
    if (result === 0) {
        // This executes only the first time the namespace is created, subsequent times through, the create ns rejects with non-zero result.
        await spawner(`kubectl apply -f ./k8s -n ${environment} ${kubectlArgs}`)
    }
    setContainerName()
    console.log(`Deploying to ${getDeploymentName('')}, ${getImageName('')}`)
    for (const deployment of DEPLOYMENTS) {
        console.log(`\x1b[33mSet image for ${getDeploymentName(deployment)}, ${getImageName(deployment)}\x1b[0m`)
        await spawner(`kubectl -n ${environment} ` +
            `set image deploy/${getDeploymentName(deployment)} ` +
            `${getDeploymentName(deployment)}=${getImageName(deployment)} ${kubectlArgs}`, false, true)
    }
}

const apply_gcloud = async (environment) => {
    console.log('Applying to gcloud')
    const project = PROJECT_LOOKUP[environment]
    if (dryRun())
        console.log(`\x1b[1m\x1b[35mThis is a dry run\x1b[0m`)
    // base64 decode the GCLOUD KEY = require(the environment variable set in the CICD job runner.
    let data = `${process.env.GCLOUD_KEY}`
    let buff = Buffer.from(data, 'base64')
    let text = buff.toString('ascii')
    // write the key to the home directory's gcloud.json file.
    writeFileSync(`${process.env.GCLOUD_KEY_FILE}`, text)
    // authenticate to gcloud
    await spawner(`gcloud auth activate-service-account --key-file=${process.env.GCLOUD_KEY_FILE}`, false, true)
    await spawner(`gcloud container clusters get-credentials hub --zone ${ZONE} --project ${project}`, false, true)
    // deploy to kubernetes in gcloud
    await setImages(environment, '')
}

const apply_kubernetes = async (environment) => {
    console.log('Applying using kubeconfig')
    let kubectlArgs
    if (onBuildServer()) {
        kubectlArgs = `--server ${process.env.KUBECONFIG_SERVER} --token ${process.env.KUBECONFIG_USER_TOKEN} --client-key 'ca_file.cert' --insecure-skip-tls-verify`
        writeFileSync(`${process.env.HOME}/ca_file.cert`, process.env.KUBECONFIG_CERT_AUTH_DATA)
    } else {
        if (!process.env.KUBECONFIG) {
            throw new GulpError('apply', new Error('Error: A KUBECONFIG environment variable must be set that points to a vailid kubeconfig yaml file.'))
        }
        kubectlArgs = `--kubeconfig ${process.env.KUBECONFIG}`
    }

    // create a namespace and deploy the containers to the cluster.
    await setImages(environment, kubectlArgs)
}

// Provider specific and repo specific steps
const apply = async (environment) => {
    if (dryRun())
        console.log(`\x1b[1m\x1b[35mThis is a dry run\x1b[0m`)
    console.log(`\x1b[1m\x1b[33mApplying kubernetes resources\x1b[0m`)

    // Authentication
    if (onBuildServer()) {
        if (!process.env.GCLOUD_KEY && (!process.env.KUBECONFIG_CERT_AUTH_DATA || !process.env.KUBECONFIG_SERVER || !process.env.KUBECONFIG_USER_TOKEN)) {
            throw new GulpError('apply', new Error('Error: If deploying with a kubeconfig, three environment variables are required for build server deployments from a valid kubeconfig.yaml file:\n' +
                'KUBECONFIG_CERT_AUTH_DATA (from clusters:- cluster: certificate-authority-data:),\n' +
                'KUBECONFIG_SERVER (from clusters:- cluster: server:), and \n' +
                'KUBECONFIG_USER_TOKEN (from users: user: token:)\n' +
                'If deploying to google cloud, you need to set a GCLOUD_KEY environment variable.'))
        }
    } else {
        if (!process.env.GCLOUD_KEY && !process.env.KUBECONFIG) {
            throw new GulpError('apply', new Error('Error: If deploying with a kubeconfig file, the KUBECONFIG environment variable must be set to a valid kubeconfig.yaml file, or a GCLOUD_KEY should be set.'))
        }
    }
    if (process.env.GCLOUD_KEY) {
        await apply_gcloud(environment)
    } else {
        await apply_kubernetes(environment)
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

    const hash = getGitHash()
    process.env.REPO_HASH = hash
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'

    console.log(`Deploying org/repo:hash --> \x1b[33m"${process.env.DOCKER_ORG}/${process.env.REPO_NAME}:${hash}"\x1b[0m into environment \x1b[33m"${environment}"\x1b[0m `)

    await apply(environment)

    // Update the repo semver tags for production.
    if (environment === 'production') {
        const versions = codeVersions()
        const version = nextVersion(versions, semver)
        const last = lastVersion(versions)
        const branch = POINTER_BRANCH_LOOKUP[environment]

        console.log(`Bump Level: \x1b[33m${semver}\x1b[0m Version: \x1b[33m${version}\x1b[0m, Last Version: \x1b[33m${last}\x1b[0m, Pointer branch: \x1b[33m${branch}\x1b[0m`)
        await updateRef(branch)
        await tagRef(version)
    }
}

const deploy = series(promote, postDeployTests)

module.exports = {
    deploy,
    promote
}
