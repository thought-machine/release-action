const release = require("./release")

const multiLineTest = `
Version 16.6.0
--------------
    * Fixed issue with \`go_module()\` where adding the root package removed
      all other items in the install list that came before #2019
    * Fixed the linker flags in \`pip_library()\` for macOS #2015
    * Added \`ExcludeGlob\` config option to the \`[Cover]\` section that
      excludes files from coverage based on a glob pattern #2020 #2023
    * Fix issue with \`go_module()\` where the incorrect release flags
      were being applied when filtering third party go sourcews #2024


Version 16.5.1
--------------
    * Fix nil pointer when tests fail in certain ways #2016


Version 16.5.0
--------------
    * Singleflight all subincludes removing any potential for lockups #2002
    * Implemented target level locking enabling multiple please instances to
      build at the same time #2004
    * Set a timeout on test result uploading #2008
    * Updated to use go 1.17. This should be transparent to any users. #2010
    * Various fixes and improvements around bash completions #1998 #2013


Version 16.4.2
--------------
    * Honour require/provide for \`plz query revdeps\` and \`plz query changes\` #1997
    * Fix \`plz tool langserver\` #1999


Version 16.4.1
--------------
    * Fixed panic when downloading outputs for stamped targets that were retrived from
      the cache #1994


`

const singleLineTest = `Version 0.1.0
-------------
    * Initial commit
`
const exepctedResult = `
* Singleflight all subincludes removing any potential for lockups #2002
* Implemented target level locking enabling multiple please instances to
  build at the same time #2004
* Set a timeout on test result uploading #2008
* Updated to use go 1.17. This should be transparent to any users. #2010
* Various fixes and improvements around bash completions #1998 #2013
`

test("parseMultipleReleaseLogs", () => {
    const result = release.findTagChangelogs(multiLineTest, "16.5.0").trim()
    expect(result).toBe(exepctedResult.trim())
})

test("parseSingleReleaseLog", () => {
    const result = release.findTagChangelogs(singleLineTest, "0.1.0").trim()
    expect(result).toBe("* Initial commit")
})