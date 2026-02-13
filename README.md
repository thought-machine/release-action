# Release action

A github action to produce a release. This project was created in frustration
with the existing release actions in the wild. The main goal was to release
based entirely off files that are checked in to version control, following
the "configuration as code" philosophy.

This action uses two files:

* VERSION - A file containing the current version of the project
* ChangeLog - A file containing changes for each release

To create a release, simply update VERSION and ChangeLog, and this
action will create a new github release accordingly. Release artefacts
can be added as well via the `releaseFiles` parameter.


## Basic usage

1) Create a file called `VERSION`, containing the semantic version e.g. `v1.2.3`. Versions
   containing a prerelease postfix will be marked as such on the projects releases page.

3) Create a file called ChangeLog with a entry for this version. This file doubles
   as a historical record of all change logs and has the following format:
```
Version 0.2.0
---------------
    * Fix bug with coffee machine # 4
    * Implement the flux conduit engine #3
    * Cross pollinated the transient energy matrix #2


Version 0.1.0
---------------
    * Implemented proof of concept transient matter densifier #1
```

3) Add a step to your `.github/workflows/X.yaml`:

```

name: X
on: [push, pull_request]
jobs:
  release:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: build
        run: ...
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        uses: thought-machine/release-action@v0.3.0
        with:
          release-files: out/package # A directory containing all the files to release
          # version-file: VERSION
          # change-log-file: ChangeLog
```

## Multiple releases

Sometimes there are multiple components or "modules" in a repo that should be released independently. To facilitate
this, this action can be repeated, specifying a different prefix for each component:

```
name: X
on: [push, pull_request]
jobs:
  release:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/master'
    steps:
      ...
      - name: Release tools
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        uses: thought-machine/release-action@v0.3.0
        with:
          release-files: out/tools # A directory containing all the files to release
          version-file: tools/VERSION
          change-log-file: tools/ChangeLog
          release-prefix: tools
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        uses: thought-machine/release-action@v0.3.0
```

This will result in tags like `tools-vX.X.X` from the `Release tools` step, and `vX.X.X` for the main `Release` step.

## Outputs

The action produces the following outputs for use by subsequent steps:

| Name | Description | Example |
| - | - | - |
| `release-created` | `true` if the action created a GitHub release, or `false` if it did not. | `true` |
| `release-tag` | If a release was created, the name of the tag created for the release in the repository. | `v1.2.3` |
| `release-id` | If a release was created, the ID assigned to the release by GitHub. This ID uniquely identifies the release in several [GitHub API endpoints](https://docs.github.com/en/rest/releases/releases). | `42` |
