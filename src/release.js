const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')

async function run() {
    try {
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

        // TODO(jpoole): validate this is a semver version
        const version = fs.readFileSync("VERSION").toString().trim()
        const changeLog = fs.readFileSync("ChangeLog").toString()

        const changes = findTagChangelogs(changeLog, version)

        if (changes === undefined || changes === "") {
            core.setFailed("Couldn't find changes for v" + version);
        }

        let releaseUrl
        try {
            releaseUrl = await octokit.rest.repos.getReleaseByTag({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                tag: "v" + version,
            })
        } catch (_) {
            // This thing throws an exception on 404...
        }

        if (releaseUrl !== undefined) {
            core.info("Release already created. Nothing to do: " + releaseUrl)
            return
        }

        const url = await octokit.rest.repos.createRelease({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tag_name: "v" + version,
            name: "v" + version,
            body: changes,
            prerelease: version.includes("beta") || version.includes("alpha") || version.includes("prerelease"),
            target_commitish: github.context.sha,
        })

        core.info(url)

    } catch (error) {
        core.setFailed(error.message);
    }

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
    return logs.join("\n")
}

run()

exports.findTagChangelogs = findTagChangelogs