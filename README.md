# axios-response-mock

The axios-response-mock is intended to be for [axios](https://github.com/axios/axios) what [fetch-mock](https://github.com/wheresrhys/fetch-mock) is for the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).
The mock can be configured to selectively intercept requests that are made via axios and answer those intercepted requests with prepared mock responses. Unmatched requests will -per default- be processed normally.

axios-response-mock uses the [axios adapter](https://github.com/axios/axios/tree/master/lib/adapters) mechanism.

## Usage

Add the `axios-response-mock` library to your `package.json` and install via [npm](https://www.npmjs.com/package/axios-response-mock).
Instantiate and connect a `Mock` to any axios instance you want to be able to intercept.
Define any routes you want to intercept, using any combination of matcher options.
A route is matched when all provided matcher options are matched.

```js
import mockBase from 'axios-response-mock';
import foobarResponse from './foobar.response.json';

// instantiate and connect a Mock to the default axios instance
const mock = mockBase.create();

// provide mock responses for:
// GET requests to http://example.org/users
// POST requests to any path containing /users/create
// GET requests when url parameter 'ID' is set to 'foobar'
// PUT requests when body contains an 'address' object
// PURGE requests, delay response by 1000 miliseconds

mock
  .get('http://example.org/users', { total: 2, users: [{ name: 'John Doe' }, { name: 'Richard Roe' }] })
  .post(/[/]users[/]create/, 201)
  .get({ query: { ID: 'foobar' } }, foobarResponse)
  .put({ body: { address: {} }, matchPartialBody: true }, 200)
  .mock({ method: 'purge' }, 401, { delay: 1000 });
```

The default export from `axios-response-mock` is the library's `base` object that can be used to `.create()` a `Mock` instance.
Importing `axios-response-mock` (without calling any functions) is side-effect-free (see https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free).

Calling `.create()` without any arguments connects the `Mock` instance to the default axios instance (the one that is obtained via `import axios from 'axios'`).
If you want to connect the mock to any other axios instance you have to provide it as an argument to `.create(axiosInstance)`.

After you obtained a `Mock` instance you can use a variety of functions to specify which requests and conditions you want to intercept.

Routes that are prepared on any specific mock can only match and intercept requests that are made via the connected axios instance that was used to create the mock.

So if your project makes use of an axios instance `exampleApi` like in the following example you can associate a new mock instance by calling `.create(exampleApi)`.

```js
import axios from 'axios';
import mockBase from 'axios-response-mock';

const exampleApi = axios.create({ baseURL: 'http://example.org/api/v1' });

const mock = mockBase.create(exampleApi);
mock.post(/* ... */); // prepare to intercept a POST request
```

## API

The API is modeled after the fetch-mock API, which has shown to be simple and clear, yet at the same time flexible, powerful, and expressive.
Currently the functions availabe are a subset of the fetch-mock functions ([more about that](https://github.com/teetotum/axios-response-mock/discussions/2)).

### base object

Obtained via `import mockBase from 'axios-response-mock'` the base object allows you to create and connect a new `Mock` instance.

```
const mock = mockBase.create()
Creates a new Mock instance, associated with the default axios instance
```

```
const mock = mockBase.create(axiosInstance)
Creates a new Mock instance, associated with axiosInstance
```

### Mock instance

The following functions are available on a `Mock` instance

```
.restore()
Ends the matching and interception of requests, restores the original axios adapter
```

```
.mock(matcher, response, options)
matcher: String | URL | RegEx | Function | Object
can not be omitted

response: String | Number | Object | Function
can only be omitted when 'response' property is set in matcher object

options: Object
is optional


supported properties in matcher object:

url,              // String (exact match), URL (exact match), RegEx (full regex functionality)

functionMatcher,  // (config) => boolean

method,           // String (case-insensitive)

headers,          // Object (hash) with key-value-pairs of type String (subset-match),
                     header keys are case-insensitive

body,             // Object, deep-equal by default, but can be subset-match with the flag matchPartialBody

matchPartialBody, // boolean flag to trigger subset-match for body

query,            // Object (hash) with key-value-pairs of type String (subset-match),
                     case-sensitive for keys and values

repeat,           // number of times the route can match,
                     after the number is reached the route will not match anymore

response,         // can be used when the response argument to .mock() is omitted
                     (same supported argument types)

delay,            // number: response delay in miliseconds


config object argument for functionMatcher has this structure:
{
    url: 'http://example.org',
    method: 'get',
    params: { ID: 12345, foo: 'bar' },
    data: '{ "firstName" : "Fred", "lastName" : "Flintstone" }',
    headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json;charset=utf-8',
        'X-Custom-Header': 'foobar',
    },
}

Be aware that the 'data' field is stringified. If your request data is JSON you will need
to call JSON.parse(config.data) before you can make any assessments of it.
```

```
// the following functions are just a shorthand for the .mock() function

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

#### Response

The response can be defined in several ways:

- String

  ```js
  mock.get(/example.com/, 'hello world');
  ```

  When matched: will return a success response with the string as payload data

  ```js
  {
    status: 200,
    statusText: 'OK',
    data: 'hello world',
  }
  ```

- Number

  ```js
  mock.get(/example.com/, 404);
  ```

  When matched: will return a response with a status corresponding to the number

  ```js
  {
    status: 404,
    statusText: 'Not Found',
  }
  ```

- Object: payload data

  ```js
  mock.get(/example.com/, { name: 'Richard Roe', registeredSince: '2010-06-12' });
  ```

  When matched: will return a success response with the object as payload data

  ```js
  {
    status: 200,
    statusText: 'OK',
    data: { name: 'Richard Roe', registeredSince: '2010-06-12' },
  }
  ```

- Object: response
  An object is treated as a response when it has `status` and `statusText` properties.
  Thus you can provide arbitrary `status`, `statusText`, `data`, `headers` used for the mock response.

  ```js
  mock.get(/example.com/, { status: 200, statusText: 'OK', headers: { 'X-custom-encabulator': '7B' } });
  ```

  When matched: will return a response as specified

  ```js
  {
    status: 200,
    statusText: 'OK',
    headers: { 'X-custom-encabulator': '7B' },
  }
  ```

- Function

  ```js
  mock.get(/example.com/, (config) => (Math.random() < 0.5 ? 200 : 404));
  ```

  When matched: will call the function; the return value of the function determines how a response is derived from it:

  - string,
  - number,
  - object as payload data,
  - object as response,
  - or even another function
