# Release action

A github action to produce a release. This project was created in frustration 
with the existing release actions in the wild. The main goal was to base releases
based entirely off files that are checked in to version control. 

This action uses two files:

* VERSION - A file containing the current version of the project
* ChangeLog - A file containing changes for each release

To create a release, simply update VERSION and ChangeLog, and this
action will create a new github release accordingly. Release artefacts 
can be added as well via the `releaseFiles` parameter.


# Basic usage

1) Create a file called `VERSION`, containing the semantic version e.g. `v0.2.0`.

2) Create a file called ChangeLog with a entry for this version. This file doubles 
   as a historical record of all change logs and has the following format:
```
Version 0.2.0
---------------
    * Fix bug with coffee machine # 4
    * Implement the flux conduit engine #3
    * Cross polinated the transient energy matrix #2


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
        uses: tatskaari/release-action@v0.2.5
        with:
          release-files: out/package # A directory containing all the files to release
```
