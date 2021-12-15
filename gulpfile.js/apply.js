const { spawner, getDeploymentName, containerImageName, dryRun, onBuildServer, deleteTag, tagRef, pushTags } = require("./utils")
const { writeFileSync } = require("fs")
const GulpError = require("plugin-error")

const ZONE = process.env.ORGANIZATION_ZONE || 'us-central1-c'
const PROJECT_LOOKUP = {
    develop: process.env.DEVELOP_PROJECT || 'traxitt-development',
    production: process.env.PRODUCTION_PROJECT || 'traxitt-development',
}
const DEPLOYMENTS = ['core', 'frontend', 'leaf', 'sockets']

const setImages = async (environment, kubectlArgs) => {
    const result = await spawner(`kubectl create ns ${environment}${kubectlArgs}`, true)
    if (result === 0) {
        // This executes only the first time the namespace is created, subsequent times through, the create ns rejects with non-zero result.
        await spawner(`kubectl apply -f ./k8s -n ${environment}${kubectlArgs}`)
    }
    console.log(`Deploying to ${getDeploymentName('')}, ${containerImageName('')}`)
    for (const deployment of DEPLOYMENTS) {
        console.log(`\x1b[33mSet image for ${getDeploymentName(deployment)}, ${containerImageName(deployment)}\x1b[0m`)
        await spawner(`kubectl -n ${environment} ` +
            `set image deploy/${getDeploymentName(deployment)} ` +
            `${getDeploymentName(deployment)}=${containerImageName(deployment)}${kubectlArgs}`, false, false)
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
    const keyFile = process.env.GCLOUD_KEY_FILE || `${process.env.HOME}/gcloud.json`
    // write the key to the home directory's gcloud.json file.
    writeFileSync(keyFile, text)
    // authenticate to gcloud
    await spawner(`gcloud auth activate-service-account --key-file=${keyFile}`, false, true)
    await spawner(`gcloud container clusters get-credentials hub --zone ${ZONE} --project ${project}`, false, true)
    // deploy to kubernetes in gcloud
    await setImages(environment, '')
}

const apply_kubernetes = async (environment) => {
    console.log('Applying using kubeconfig')
    let kubectlArgs
    if (onBuildServer()) {
        kubectlArgs = ` --server ${process.env.KUBECONFIG_SERVER} --token ${process.env.KUBECONFIG_USER_TOKEN} --client-key 'ca_file.cert' --insecure-skip-tls-verify`
        writeFileSync(`${process.env.HOME}/ca_file.cert`, process.env.KUBECONFIG_CERT_AUTH_DATA)
    } else {
        if (!process.env.KUBECONFIG) {
            throw new GulpError('apply', new Error('Error: A KUBECONFIG environment variable must be set that points to a vailid kubeconfig yaml file.'))
        }
        kubectlArgs = ` --kubeconfig ${process.env.KUBECONFIG}`
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
    await deleteTag(environment)
    await tagRef(environment, process.env.REPO_HASH)
    await pushTags()
}

module.exports = {
    apply
}