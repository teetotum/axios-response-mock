# what do I need to do for the current release?

related: https://github.com/axios/axios/pull/5162

## must

- cleanup dependencies, devDependencies, and peerDependencies

ensure newest Chrome + release candidate of axios-response-mock works with the following axios versions

- axios 1.2.0 (latest)
- axios 1.0.0 (breaking changes w.r.t. module structure and exports)
- axios 0.27.2 (last version before major changes)
- axios 0.26.1 (last version to use `Error` instead of `AxiosError`)

(for each: test mocked success case (status 200) and test mocked failure case (status 400)):

## nice-to-have

- ensure IE11 + release candidate of axios-response-mock works with the following axios versions:

  - axios 0.27.2
  - axios 0.26.1

- add support for axios versions below 0.13.0
- add more API documentation
- add comparison between axios-mock-adapter and axios-response-mock, showing differences, explaining why people should use the latter
