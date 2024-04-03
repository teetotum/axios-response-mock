# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0 - 2024-04-03

### Added

- added more documentation for `matcher`, `response`, and `options` parameters

### Changed

- changed min version for axios as a required peer dependency increased to v1.5.0 (exports `getAdapter`)

### Fixed

- fixed passthrough scenario (was broken since axios v1.2.0)

## 0.2.2 - 2022-12-29

### Fixed

- fixed route matching with relative `url` (string matcher): is now using `axios.baseURL` to turn relative URL into absolute URL
- fixed URL param matching for the edge case of having multiple params with the same name

## 0.2.1 - 2022-12-07

### Fixed

- fixed route matching with `matcher.query` (was causing a runtime error when used with relative URLs)
- fixed route matching with relative `url` (string matcher)

## 0.2.0 - 2022-12-06

### Added

- you can now define a response with `status`, `statusText`, `data`, `headers`

### Fixed

- `matcher.query` is now checked against both: parameters set via axios request `options.params` and URL parameters defined directly in the URL string via `?foo=bar`

## 0.1.0 - 2022-12-05

### Added

- added `module` key to package.json
- added `sideEffects: false` to package.json

### Changed

- the default export is no longer a `Mock` instance (wired to the default `axios` instance) but instead is the library's `base` object that can be used to `.create()` a `Mock` instance. So importing `axios-response-mock` (without calling any functions) is side-effect-free (see https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free)

### Fixed

- response `statusText` is now set according to `statusCode`
- mock error responses now use either `Error` or `AxiosError` instances (corresponding to the used axios version)

## 0.0.4 - 2020-06-09

### Fixed

- removed experimental `module` key from package.json, was causing issues when package was used with older browsers

## 0.0.3 - 2020-06-08

### Fixed

- dist bundle transpiled to ES5 to support IE11 (was ES6)

## 0.0.2 - 2020-05-25

### Added

- Basic documentation for `.create(),` `.restore()`, `.mock()`, and shorthand functions for `.mock()`
- Support for response `delay` option
- Changelog

### Changed

- When a function is provided as the `response` argument for `.mock()` the function result was formerly treated as the payload of a success response (status 200), this is now changed so the result is processed as if it was provided directly as the `response` argument. This for example allows a function to contain a switch to return 200 or 400 or any other HTTP status code and trigger a corresponding response

### Fixed

- Status codes other than those in the 200-299 range will now correctly trigger a `Promise reject` instead of a `resolve`.

## 0.0.1 - 2020-05-18

### Added

- Basic response mock implementation
