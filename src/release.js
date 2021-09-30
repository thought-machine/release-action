const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')
const crypto = require("crypto")
const path = require('path')

function hash(data) {
    const hash = crypto.createHash("sha256")
    hash.write(data)
    return hash.digest()
}

async function run() {
    try {
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
        const releaseFiles = core.getInput("release-files")
        const versionFile = core.getInput("version-file")
        const changelogFile = core.getInput("change-log-file")

        // TODO(jpoole): validate this is a semver version
        const version = fs.readFileSync(versionFile).toString().trim()
        const changeLog = fs.readFileSync(changelogFile).toString()

        const changes = findTagChangelogs(changeLog, version)

        if (changes === undefined || changes === "") {
            core.setFailed("Couldn't find changes for v" + version);
        }

        let existingReleaseResp
        try {
            existingReleaseResp = await octokit.rest.repos.getReleaseByTag({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                tag: "v" + version,
            })
        } catch (_) {
            // This thing throws an exception on 404...
        }

        if (existingReleaseResp !== undefined) {
            core.info("Release already created. Nothing to do. ")
            return
        }

        const createReleaseResp = await octokit.rest.repos.createRelease({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            tag_name: "v" + version,
            name: "v" + version,
            body: changes,
            prerelease: version.includes("beta") || version.includes("alpha") || version.includes("prerelease"),
            target_commitish: github.context.sha,
        })

        fs.readdirSync(releaseFiles, {withFileTypes: true}).forEach(file => {
            if (file.isFile()) {
                const fileData = fs.readFileSync(path.join(releaseFiles, file.name))
                const hashsum = hash(fileData)

                octokit.rest.repos.uploadReleaseAsset({
                    repo: github.context.repo.repo,
                    owner: github.context.repo.owner,
                    release_id: createReleaseResp.data.release_id,
                    name: file.name,
                    data: fileData,
                    origin: createReleaseResp.data.upload_url
                })

                octokit.rest.repos.uploadReleaseAsset({
                    repo: github.context.repo.repo,
                    owner: github.context.repo.owner,
                    release_id: createReleaseResp.data.release_id,
                    name: file.name + ".sha256",
                    data: hashsum,
                    origin: createReleaseResp.data.upload_url
                })
            }
        })
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


