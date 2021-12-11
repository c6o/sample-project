const execSync = require('child_process').execSync
const spawn = require('child_process').spawn

const dryRun = () => {
    return process.argv.some(arg => arg === '--dryrun')
}

const spawner = async (commandString) => {
    const args = commandString.split(' ')
    const command = args.shift()
    const argsString = args.reduce((acc, arg) => acc+arg+' ', '')
    if (dryRun()) {
        console.log(`\x1b[31m${command} ${argsString}\x1b[0m`)
        return await new Promise((resolve, reject) => {
            resolve()
        })
    }
    console.log(`\x1b[33m${command} ${argsString}\x1b[0m`)
    const child = spawn(command, args, {stdio: "inherit"})

    return await new Promise( (resolve, reject) => {
        child.on('close', resolve)
        child.on('error',reject)
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

const tagRef = (version) => {
    const command = `git tag -a ${version} -m "${version}"`
    return execer(command, dryRun())
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
    return tagCompile(semver.join('.'))
}

const onBuildServer = () => {
    return process.platform === 'linux'
}

module.exports = {
    dryRun, getGitHash, getGitName, spawner, updateRef, codeVersions, lastVersion, nextVersion, onBuildServer, tagRef
}
