const GulpError = require("plugin-error")
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn

const DEFAULT_REPO_NAME = 'sample_project' /* TODO: getGitName() */
const DEFAULT_ORG_NAME =  'robblovell' /* TODO: c6oio */
const dryRun = () => {
    return process.argv.some(arg => arg === '--dryrun')
}

const spawner = async (commandString, noThrow = false, hide = false) => {
    const args = commandString.split(' ')
    const command = args.shift()
    const argsString = hide ? '' : args.reduce((acc, arg) => acc+arg+' ', '').trim()
    if (dryRun()) {
        console.log(`\x1b[31m${command} ${argsString}\x1b[0m`)
        return await new Promise((resolve) => {
            resolve()
        })
    }
    console.log(`\x1b[33m${command} ${argsString}\x1b[0m`)

    const child = spawn(command, args, { stdio: 'inherit' })

    return await new Promise( (resolve) => {
        child.on('close', (result) => {
            if (result !== 0) {
                if (noThrow) {
                    console.log(`\x1b[35mSafely ignoring error in ${command} ${argsString}\x1b[0m`)
                    resolve(new Error(result))
                } else {
                    throw new GulpError(`run command`,
                        new Error(`\x1b[31m\x1b[40m"${command} ${argsString}" failed, see output of command above.\x1b[0m`))
                }
            }
            resolve(result)
        })
    })
}

const execer = (commandString, dryrun=false) => {
    if (dryrun) {
        console.log(`\x1b[31m${commandString}\x1b[0m`)
        return undefined
    }
    console.log(`\x1b[33m${commandString}\x1b[0m`)
    return execSync(commandString)
}

const getGitRevision = () => {
    const revision = execer('git rev-parse HEAD').toString().trim()
    return { revision, hash: revision.slice(0,7) }
}

const getGitHash = () => {
    const { hash } = getGitRevision()
    return hash
}

const getGitName = () => {
    return execer('basename `git rev-parse --show-toplevel`').toString().trim()
}

const setGitUser = () => {
    process.env.GIT_DEPLOYER_EMAIL = process.env.GIT_DEPLOYER_EMAIL || "github-actions-bot@codezero.io"
    process.env.GIT_DEPLOYER_USER = process.env.GIT_DEPLOYER_USER || "github-actions-bot"
    execer(`git config --global user.email "${process.env.GIT_DEPLOYER_USER || "deployer"}"`, dryRun())
    execer(`git config --global user.name "${process.env.GIT_DEPLOYER_USER || "deployer"}"`, dryRun())
}

const tagExists = (tag) => {
    try {
        return execer(`git rev-parse -q --verify "refs/tags/${tag}"`)
    } catch {}
}
const getGitHashForTag = (tag) => {
    try {
        if (tagExists(tag)) {
            return execer(`git rev-list -n 1 ${tag}`)?.toString().slice(0, 7)
        }
    } catch {}
}

const tagRef = (version, commit) => {
    if (getGitHashForTag(version)) {
        console.log(`\x1b[35mTag ${version} already exists, skipping creating of tag\x1b[0m`)
        return
    }
    return execer(`git tag -a ${version} ${commit} -m "${version}"`, dryRun())
}

const fetchTags = () => {
    return execer('git fetch --all --tags', dryRun())
}
const pushTags = () => {
    return execer(`git push origin --tags`, dryRun())
}

const deleteTag = (tag) => {
    try {
        execer(`git tag --delete ${tag}`, dryRun())
    } catch (error) {
        console.log(`\x1b[35mTag ${tag} is already deleted.\x1b[0m`)
    }
    try {
        execer(`git push origin :refs/tags/${tag}`, dryRun())
    } catch (error) {
        console.log(`\x1b[35mTag ${tag} is already deleted on the origin.\x1b[0m`)
    }
}

const codeVersions = (tagFilter = (ele) => ele.startsWith('version')) => {
    const tagString = execer(`git tag`)
    const tags = tagString.toString().split('\n')
    const uniq = [...new Set(tags)]
    return uniq.filter(tagFilter)
}

const lastVersion = (versions) => {
    return versions[versions.length-1] || 'version/0.0.0'
}

const nextVersion = (versions, level, semverParse = (str) => str.substring(8), tagCompile = ele => 'version/' + ele) => {
    const last = lastVersion(versions)
    console.log("last: ", last)
    const digits = semverParse(last)
    console.log("digets: ", last)
    const semver = digits.split('.')
    switch(level) {
        case 'major': semver[0] = (Number(semver[0]) + 1).toString(); semver[1] = '0'; semver[2] = '0';break
        case 'minor': semver[1] = (Number(semver[1]) + 1).toString(); semver[2] = '0'; break
        case 'patch': semver[2] = (Number(semver[2]) + 1).toString(); break
    }
    const version = tagCompile(semver.join('.')).toString()
    console.log("version", version)
    return version
}

const previousVersion = (versions, backby) => {
    return versions[versions.length-(Number(backby)+1)] || undefined
}

const onBuildServer = () => {
    return process.platform === 'linux'
}

const setContainerName = (
    hash = getGitHash(),
    name = DEFAULT_REPO_NAME,
    org = DEFAULT_ORG_NAME) => {
    process.env.REPO_HASH = process.env.REPO_HASH || hash
    process.env.REPO_NAME = process.env.REPO_NAME || name
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || org
}

const containerTag = (hash = process.env.REPO_HASH , name = process.env.REPO_NAME, org = process.env.DOCKER_ORG) => {
    return `container/${org}-${name}-${hash}`
}

const containerImageName = (which, hash = process.env.REPO_HASH , name = process.env.REPO_NAME, org = process.env.DOCKER_ORG) => {
    return `${org}/${name}-${which}:${hash}`
}

const getDeploymentName = (which, name = process.env.REPO_NAME ) => {
    return `${name}-${which}`
}

module.exports = {
    codeVersions,
    containerTag,
    deleteTag,
    dryRun,
    fetchTags,
    getDeploymentName,
    getGitHash,
    getGitHashForTag,
    getGitName,
    containerImageName,
    lastVersion,
    nextVersion,
    onBuildServer,
    previousVersion,
    pushTags,
    setContainerName,
    setGitUser,
    spawner,
    tagExists,
    tagRef,
}
