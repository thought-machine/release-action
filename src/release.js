const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')

try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    // TODO(jpoole): validate this is a semver version
    const version = fs.readFileSync("VERSION").toString().trim()
    const changeLog = fs.readFileSync("ChangeLog").toString()

    const changes = findTagChangelogs(changeLog, version)

    octokit.rest.repos.createRelease({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        tag_name: "v"+version,
        name: "v"+version,
        body: changes,
        prerelease: version.includes("beta") || version.includes("alpha") || version.includes("prerelease"),
        target_commitish: github.context.sha,
    }).catch(error => {
        core.setFailed(error.message);
    })
} catch (error) {
    core.setFailed(error.message);
}

function findTagChangelogs(changelog, tag) {
    const versionString = "Version " + tag

    const lines = changelog.split("\n")
    let foundVersion = false
    let logs = []
    for(let i = 0; i < lines.length; i++) {
        let line = lines[i]
        if (line.startsWith(versionString)) {
            foundVersion = true
            continue
        }
        if (!foundVersion) {
            continue
        }

        if (line.startsWith("Version")) {
            return logs.join("\n")
        }

        if (line.startsWith("-")) {
            continue
        }

        line = line.trim()
        if (line === "") {
            continue
        }
        if (line.startsWith("*")) {
            logs.push(line)
        } else {
            logs.push("  " + line)
        }
    }
    return undefined
}

exports.findTagChangelogs = findTagChangelogs