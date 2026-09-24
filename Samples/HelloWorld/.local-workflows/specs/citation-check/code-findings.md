# Code findings: citation-check

- local-workflows: `Samples/HelloWorld` - a subfolder of the single git repo rooted at `D:/Work/local-workflows`; no nested `.git`, no `package.json`, no `.sln`/`.csproj` of its own.
- local-workflows: `Samples/HelloWorld/scripts` - contains only `greet.js`, `hello.ps1`, `fail.ps1`; no `scripts/citations` folder exists yet.
- local-workflows: `Samples/HelloWorld` - no `README.md`, `CLAUDE.md`, `AGENTS.md`, or steering-doc folder anywhere in the sample.
- local-workflows: repo root (`D:/Work/local-workflows`) - no `PULL_REQUEST_TEMPLATE` file anywhere outside `node_modules`/vendored gems.
- local-workflows: repo root (`D:/Work/local-workflows`) - has its own `package.json` and `.debug/package.json` (the VS Code extension itself); unrelated to `Samples/HelloWorld`, which has none of its own.
