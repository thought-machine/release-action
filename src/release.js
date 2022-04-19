const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs')
const crypto = require("crypto")
const path = require('path')

function hash(data, name) {
    const hash = crypto.createHash("sha256")
    hash.write(data)
    return hash.digest("hex") + "  " + name + "\n"
}

async function run() {
    try {
        const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

        const releaseFiles = core.getInput("release-files")
        const versionFile = core.getInput("version-file")
        const changelogFile = core.getInput("change-log-file")
        const releasePrefix = core.getInput("release-prefix")

        const version = fs.readFileSync(versionFile).toString().trim().replace(/^v/,"");

        const changeLog = fs.readFileSync(changelogFile).toString()

        const changes = findTagChangelogs(changeLog, version)

        if (changes === undefined || changes === "") {
            core.setFailed("Couldn't find changes for v" + version);
            return
        }

        let uploadUrl = undefined
        let releaseId = undefined

        let releaseName = `v${version}`
        if(releasePrefix !== "") {
            releaseName = `${releasePrefix}-${releaseName}`
        }

        try {
            existingReleaseResp = await octokit.rest.repos.getReleaseByTag({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                tag: releaseName,
            })
            uploadUrl = existingReleaseResp.data.upload_url
            releaseId = existingReleaseResp.data.id
        } catch (_) {
            // This thing throws an exception on 404...
        }

        if (uploadUrl === undefined) {
            console.log(`Creating release ${releaseName}...`)

            const createReleaseResp = await octokit.rest.repos.createRelease({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                tag_name: releaseName,
                name: releaseName,
                body: changes,
                prerelease: version.includes("-"),
                target_commitish: github.context.sha,
            })

            uploadUrl = createReleaseResp.data.upload_url
            releaseId = createReleaseResp.data.id
        } else {
            console.log("Release already created. Nothing to do.")
            return
        }

        if (releaseFiles !== "") {
            console.log("Uploading release assets... ")
            const files = fs.readdirSync(releaseFiles, {withFileTypes: true})

            for(let i = 0; i < files.length; i++) {
                const file = files[i]

                if (file.isFile()) {
                    const fileData = fs.readFileSync(path.join(releaseFiles, file.name))
                    const hashsum = hash(fileData, file.name)

                    await octokit.rest.repos.uploadReleaseAsset({
                        repo: github.context.repo.repo,
                        owner: github.context.repo.owner,
                        release_id: releaseId,
                        name: file.name,
                        data: fileData,
                        origin: uploadUrl
                    })

                    await octokit.rest.repos.uploadReleaseAsset({
                        repo: github.context.repo.repo,
                        owner: github.context.repo.owner,
                        release_id: releaseId,
                        name: file.name + ".sha256",
                        data: hashsum,
                        origin: uploadUrl
                    })

                    console.log(file.name + "... done.")
                }
            }
        }
    } catch (error) {
        console.log(error)
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


