const GulpError = require("plugin-error")
const execSync = require('child_process').execSync
const spawn = require('child_process').spawn

const dryRun = () => {
    return process.argv.some(arg => arg === '--dryrun')
}

const spawner = async (commandString, noThrow = false, hide = false) => {
    const args = commandString.split(' ')
    const command = args.shift()
    const argsString = hide ? '' : args.reduce((acc, arg) => acc+arg+' ', '').trim()
    if (dryRun()) {
        console.log(`\x1b[31m${command} ${argsString}\x1b[0m`)
        return await new Promise((resolve, reject) => {
            resolve()
        })
    }
    console.log(`\x1b[33m${command} ${argsString}\x1b[0m`)

    const child = spawn(command, args, { stdio: 'inherit' })

    return await new Promise( (resolve, reject) => {
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
    const { revision, hash } = getGitRevision()
    return hash
}

const getGitName = () => {
    return execer('basename `git rev-parse --show-toplevel`').toString().trim()
}

const updateRef = (branch) => {
    const { revision, hash } = getGitRevision()
    //TODO: Investigate using git fast forward
    const command = `git update-ref -m "${branch} to ${hash}" refs/heads/${branch} ${revision}`
    return execer(command, dryRun())
}

const setGitUser = () => {
    process.env.GIT_DEPLOYER_EMAIL = process.env.GIT_DEPLOYER_EMAIL || "github-actions-bot@codezero.io"
    process.env.GIT_DEPLOYER_USER = process.env.GIT_DEPLOYER_USER || "github-actions-bot"
    execer(`git config --global user.email "${process.env.GIT_DEPLOYER_USER || "deployer"}"`, dryRun())
    execer(`git config --global user.name "${process.env.GIT_DEPLOYER_USER || "deployer"}"`, dryRun())
}

const tagExists = (tag) => {
    return execer(`git rev-parse -q --verify "refs/tags/${tag}"`)
}
const getGitHashForTag = (tag) => {
    try {
        if (tagExists(tag)) {
            return execer(`git rev-list -n 1 ${tag}`)?.toString().slice(0, 7)
        }
    } catch {
        console.log(`\x1b[35mHash for tag ${tag} not found, ignoring... \x1b[0m`)
        return undefined
    }
}

const tagRef = (version, commit) => {
    if (getGitHashForTag(version)) {
        console.log(`\x1b[35mVersion ${version} already exists, skipping tagging of version\x1b[0m`)
        return
    }
    return execer(`git tag -a ${version} ${commit} -m "${version}"`, dryRun())
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

const codeVersions = (tagFilter = (ele) => ele.startsWith('v')) => {
    const tagString = execer(`git tag`)
    const tags = tagString.toString().split('\n')
    const uniq = [...new Set(tags)]
    const uniqFiltered = uniq.filter(tagFilter)
    return uniqFiltered
}

const lastVersion = (versions) => {
    return versions[versions.length-1] || '0.0.0'
}

const nextVersion = (versions, level, semverParse = (str) => str.substring(1), tagCompile = ele => 'v' + ele) => {
    const last = lastVersion(versions)
    const digits = semverParse(last)
    const semver = digits.split('.')
    switch(level) {
        case 'major': semver[0] = (Number(semver[0]) + 1).toString(); break
        case 'minor': semver[1] = (Number(semver[1]) + 1).toString(); break
        case 'patch': semver[2] = (Number(semver[2]) + 1).toString(); break
    }
    const version = tagCompile(semver.join('.')).toString()
    return version
}

const previousVersion = (versions, backby) => {
    return versions[versions.length-(Number(backby)+1)] || undefined
}

const onBuildServer = () => {
    return process.platform === 'linux'
}

const setContainerName = () => {
    process.env.REPO_HASH = process.env.REPO_HASH || getGitHash()
    process.env.REPO_NAME = process.env.REPO_NAME || getGitName()
    process.env.DOCKER_ORG = process.env.DOCKER_ORG || 'c6oio'
}

const getImageName = (which) => {
    if (!process.env.REPO_NAME) {
        setContainerName()
    }
    return `${process.env.DOCKER_ORG}/${process.env.REPO_NAME}-${which}:${process.env.REPO_HASH}`
}

const getDeploymentName = (which) => {
    if (!process.env.REPO_NAME) {
        setContainerName()
    }
    return `${process.env.REPO_NAME}-${which}`
}

module.exports = {
    codeVersions,
    deleteTag,
    dryRun,
    getDeploymentName,
    getGitHash,
    getGitHashForTag,
    getGitName,
    getImageName,
    lastVersion,
    nextVersion,
    onBuildServer,
    previousVersion,
    pushTags,
    setContainerName,
    setGitUser,
    spawner,
    tagRef,
    updateRef,
}
