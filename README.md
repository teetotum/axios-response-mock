# axios-response-mock

The axios-response-mock is intended to be for [axios](https://github.com/axios/axios) what [fetch-mock](https://github.com/wheresrhys/fetch-mock) is for the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
The mock can be configured to selectively interecept requests that are made via axios and answer those intercepted requests with prepared mock responses. Unmatched requests will -per default- be processed normally.

axios-response-mock uses the [axios adapter](https://github.com/axios/axios/tree/master/lib/adapters) mechanism.

# Usage

Use as any other npm package. If you need the mock only when runninng automated tests add 'axios-response-mock' to your devDependencies. If you need the mock during runtime add 'axios-response-mock' to your dependencies.

```
import axiosResponseMock from 'axios-response-mock';
import foobarResponse from './foobar.response.json'

// provide mock responses for:
// GET requests to http://example.org/users
// POST requests to any path containing /users/create
// GET requests when url parameter 'ID' is set to 'foobar'
// PUT requests when body contains an 'address' object
// PURGE requests

axiosResponseMock.
  .get('http://example.org/users', { total: 2, users: [{ name: 'Bruce Wayne' }, { name: 'Peter Parker' }] } )
  .post(/[/]users[/]create/, 201)
  .get({ query: { ID: 'foobar' }}, foobarResponse)
  .put({ body: { address: {} }, matchPartialBody: true }, 200)
  .mock({ method: 'purge' }, 401)
```

The default instance of the mock (i.e. the imported axiosResponseMock in the example above) is automatically associated with the default axios instance (i.e. the result of an import of 'axios'). Therefore any routes that are prepared on the default mock can only match requests that are made via the default axios instance.

If your project makes use of other axios instances like in the following example you can associate a new mock instance by calling the `.create()` function.

```
import axios from 'axios';
import axiosResponseMock from 'axios-response-mock';

const exampleApi = axios.create({ baseURL: 'http://example.org/api/v1' });

axiosResponseMock.create(exampleApi).post(/* ... */)
```

# API documentation

The API is modeled after the fetch-mock API, which has shown to be simple and clear, yet at the same time flexible, powerful, and expressive.
Currently the methods availabe are a subset of the fetch-mock methods.

```
.create(axiosInstance)
Creates a new axios-response-mock instance, associated with the axiosInstance
```

```
.restore()
Ends the matching and interception of requests, restores the original axios adapter
```

```
.mock(matcher, response, options)
matcher: String, URL, RegEx, Function, Object
can not be omitted

response: String, Number, Object, Function
can only be omitted when 'response' property is set in matcher object

options: Object
is optional



supported properties in matcher object:
url,                  // String (exact match), URL (exact match), RegEx (full regex functionality)
functionMatcher,      // (config) => boolean
method,               // String (case-insensitive)
headers,              // Object (hash) with key-value-pairs of type String (subset-match), header keys are case-insensitive
body,                 // Object, deep-equal by default, but can be subset-match with the flag matchPartialBody
matchPartialBody,     // boolean flag to trigger subset-match for body
query,                // Object (hash) with key-value-pairs of type String (subset-match), case-sensitive for keys and values
repeat,               // number of times the route can match, after the number is reached the route will not match anymore

// config object for functionMatcher has this structure:
// {
//     url: 'http://example.org',
//     method: 'get',
//     params: { ID: 12345, foo: 'bar' },
//     data: '{ "firstName" : "Fred", "lastName" : "Flintstone" }',
//     headers: {
//         Accept: 'application/json, text/plain, */*',
//         'Content-Type': 'application/json;charset=utf-8',
//         'X-Custom-Header': 'foobar',
//     },
// }
```

```
// the following functions are just shortcuts

.get(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "GET" });
}

.head(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "HEAD" });
}

.post(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "POST" });
}

.put(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "PUT" });
}

.delete(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "DELETE" });
}

.patch(matcher, response, options) {
  return this.mock(matcher, response, { ...options, method: "PATCH" });
}

.once(matcher, response, options) {
  return this.mock(matcher, response, { ...options, repeat: 1 });
}

.any(response, options) {
  return this.mock(() => true, response, options);
}
```

# TODOs

- add support for axios versions below 0.13.0
- add more API documentation
- add comparison between axios-mock-adapter and axios-response-mock, showing differences, explaining why people should use the latter
