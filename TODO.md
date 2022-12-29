# what do I need to do for the current release?

## investigate 'originalAdapter is not a function' in the fallthrough scenario

- in axios v 1.1.3 (and below) the original default adapter is a function
- (in axios v 1.2.0-alpha.1 the original default adapter is still a function)
- in axios v 1.2.0 (and above) the original default adapter is an array `['xhr', 'http']`

the change was introduced with `#5277` https://github.com/axios/axios/pull/5277
(Changelog entry: `refactor: allowing adapters to be loaded by name #5277`)
(merged November 22nd) and released with v1.2.0 on November 22nd

If a custom adapter now wants to selectively decide which requests to handle itself and which requests to let fallthrough to the default adapter / delegate to the default adapter, how best would it now obtain a reference to the default adapter?

Before the change, a custom adapter could secure a reference to the default adapter via `axiosInstance.defaults.adapter` and call it later to delegate.

Example:

```
this.originalAdapter = axiosInstance.defaults.adapter;
axiosInstance.defaults.adapter = this._processRequest.bind(this);

// and later
if (matchedRoute)
    return this._respond(matchedRoute, config);
else
    return this.originalAdapter(config);
```

There is a related feature request https://github.com/axios/axios/pull/5324
and it seems others are also in need of this https://github.com/Gerhut/axiosist/issues/55

some ideas for how to obtain the xhr adapter can be found here https://github.com/axios/axios/issues/2968

What options do we have now?

- re-implement and ship my own xhr adapter? no, not feasible.
- import the axios v1.2.0 xhr and http adapters and include in my library bundle? could work. would only consider this as a temporary solution
- refactor response-mock implementation to work in two separate steps: custom interceptor to check if a mocked route matches, and if that's the case add mock adapter to the options, which means all non-matching routes are handled normally. This is an elegant solution, but I would prefer a pure adapter approach as soon as axios adds a feature to delegate to the default adapter.

Conclusion:

- branch from current master
- try out if I can actually reference and bundle the xhr adapter from axios v1.2.0
- publish as 0.2.2-alpha.1
- share my findings with https://github.com/axios/axios and https://github.com/ctimmerm/axios-mock-adapter

## must

- fix runtime error 'originalAdapter is not a function'
- refactor 'relative url handling'
- tryout if shorthand methods work correctly when options object is undefined
- add support for Promise as response type
- allow logging per route options

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
