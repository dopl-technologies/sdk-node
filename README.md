# sdk-node
A node SDK used to connect to DOPL Technologies telerobotic services

## Setup
1. Use node v10.21.0
1. `npm install @dopl-technologies/telerobotic-sdk@1.0.0`

## Download libsdk
```shell
# Downloads libsdk
$ GITHUB_TOKEN=<token_with_libsdk_repo_access> npm run download
```

## Publish
```shell
$ GITHUB_TOKEN=<token_with_libsdk_repo_access> npm publish
```

## Updating libsdk asset
```shell
$ curl -s -u dopl-builder:<githubtoken> https://api.github.com/repos/dopl-technologies/libsdk/releases/tags/v1.0.0

# Update download_libsdk
```