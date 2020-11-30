import axios from 'axios';
import isSubset from 'is-subset';
import isEqual from 'lodash/isEqual';
import { isHeadersSubset } from './headers';
import HTTPStatusCode from 'http-status-code';


//import createError from 'axios/lib/core/createError';
// todo: can we import createError from axios/core ?
const wrapError = (config, response) => {
  const message = `Request failed with HTTP status code ${response.status}`
  const error = new Error(message);
  error.config = config;
  error.response = response;
  error.isAxiosError = true;
  return error;
}

const responseFromStatusCode = (statusCode, config) => (
  {
    data: null,
    status: statusCode,
    statusText: HTTPStatusCode.getMessage(statusCode),
    headers: config.headers,
    config: config,
    request: config.request,
  }
);

const responseWithData = (data, config) => (
  {
    data: data,
    status: 200,
    statusText: 'OK',
    headers: config.headers,
    config: config,
    request: config.request,
  }
);

const deriveResponse = (responseDeclaration, config) => {
  switch (typeof responseDeclaration) {
    case 'function':
      return deriveResponse(responseDeclaration(config), config);
    case 'number':
      return responseFromStatusCode(responseDeclaration, config);
    case 'string':
      return responseWithData(responseDeclaration, config);
    case 'object':
      // todo: distinguish between objects that represent DATA, or are PROMISE interface, or are RESPONSE interface
      return responseWithData(responseDeclaration, config);
    default: throw new Error(
      `type ${typeof responseDeclaration} of response declaration is not supported`,
    );
  }
};

const matchesAllCriteria = (route, config) => {
  // cheap checks happen before expensive checks
  // (heuristically, because we can't know for sure if for example
  // the functionMatcher is more expensive than the url matcher Regex of Cthulhu)
  //
  // therefore the order of checks is:
  // 'repeat' (simple number comparison),
  // 'method' (simple string comparison),
  // 'url' (string comparison or Regex test)
  // 'headers' (iterate through key-value-pairs and do a string comparison for each)
  // 'query' (iterate through key-value-pairs and do a string comparison for each)
  // 'body' (recursive deep equal)
  // 'functionMatcher' (could be anything)

  // config object looks like this:
  // {
  //     url: 'http://example.org',
  //     method: 'get',
  //     params: { ID: 12345, foo: 'bar' },
  //     data: '{"firstName":"Fred","lastName":"Flintstone"}',
  //     headers: {
  //         Accept: 'application/json, text/plain, */*',
  //         'Content-Type': 'application/json;charset=utf-8',
  //         'X-Custom-Header': 'foobar',
  //     },
  //     transformRequest: [ [Function: transformRequest] ],
  //     transformResponse: [ [Function: transformResponse] ],
  //     timeout: 0,
  //     adapter: [Function: bound _processRequest],
  //     xsrfCookieName: 'XSRF-TOKEN',
  //     xsrfHeaderName: 'X-XSRF-TOKEN',
  //     maxContentLength: -1,
  //     validateStatus: [Function: validateStatus],
  // }

  // check special case 'repeat is zero'
  if (route.criteria.repeat === 0) return false;

  // check 'repeat is positive'
  if (route.criteria.repeat > 0) {
    if (!(route.history.length < route.criteria.repeat)) return false;
  }

  // check method
  if (
    route.criteria.method &&
    route.criteria.method.toLowerCase() !== config.method.toLowerCase()
  ) {
    return false;
  }

  // TODO: URL might not be supported by IE11
  // check url
  if (route.criteria.url) {
    if (typeof route.criteria.url === 'string') {
      if (new URL(route.criteria.url).href !== new URL(config.url).href)
        return false;
    } else {
      if (route.criteria.url instanceof RegExp) {
        if (!route.criteria.url.test(config.url)) return false;
      }

      if (route.criteria.url instanceof URL) {
        if (route.criteria.url.href !== new URL(config.url).href) return false;
      }
    }
  }

  // check headers
  if (route.criteria.headers) {
    if (!isHeadersSubset(config.headers, route.criteria.headers)) return false;
  }

  // check query
  if (route.criteria.query) {
    if (!isSubset(config.params, route.criteria.query)) return false;
  }

  // check body
  if (route.criteria.body) {
    const actualBody = JSON.parse(config.data);
    if (route.criteria.matchPartialBody) {
      if (!isSubset(actualBody, route.criteria.body)) return false;
    } else {
      if (!isEqual(actualBody, route.criteria.body)) return false;
    }
  }

  // check functionMatcher
  if (route.criteria.functionMatcher) {
    if (!route.criteria.functionMatcher(config)) return false;
  }

  route.history.push(config);

  return true;
};

class Mock {
  constructor(axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    axiosInstance.defaults.adapter = this._processRequest.bind(this);
    this.preparedRoutes = [];
  }

  _respond(matchedRoute, config) {
    const response = deriveResponse(matchedRoute.response, config, matchedRoute.responseOptions);
    const statusOK = config.validateStatus(response.status);
    const delay = matchedRoute.responseOptions.delay;

    if (delay) return new Promise((resolve, reject) => setTimeout(() => statusOK ? resolve(response) : reject(wrapError(config, response)), delay));


    if (statusOK)
      return Promise.resolve(response);
    else
      return Promise.reject(wrapError(config, response));
  }

  _processRequest(config) {
    const matchedRoute = this.preparedRoutes.find((route) =>
      matchesAllCriteria(route, config),
    );

    if (matchedRoute)
      return this._respond(matchedRoute, config);
    else
      return this.originalAdapter(config);
  }

  create(axiosInstance) {
    return new Mock(axiosInstance);
  }

  restore() {
    this.axiosInstance.defaults.adapter = this.originalAdapter;
  }

  _addRoute(response, options) {
    if (!response)
      throw new Error(`argument 'response' invalid: argument is ${response}`);

    const {
      delay,
      sendAsJson,
      includeContentLength,
      //---------------------------------------
      url,
      functionMatcher,
      method,
      headers,
      body,
      matchPartialBody,
      query,
      //params, // currently no support for expressJS
      repeat,
      name, // not supported yet
      overwriteRoutes, // what's that?
      //response, // not supported in options, only in matcher object
    } = options;

    const responseOptions = {
      delay,
      sendAsJson,
      includeContentLength,
    };

    const criteria = {
      url,
      functionMatcher,
      method,
      headers,
      body,
      matchPartialBody,
      query,
      repeat,
    };

    this.preparedRoutes.push({
      criteria,
      response,
      responseOptions,
      history: [],
    });
  }

  mock(matcher, response, options) {
    // matcher can be:
    //String | RegExp | Function | URL | Object

    switch (typeof matcher) {
      case 'string':
        this._addRoute(response, { ...options, url: matcher });
        break;
      case 'function':
        this._addRoute(response, { ...options, functionMatcher: matcher });
        break;
      case 'object':
        if (matcher instanceof RegExp)
          this._addRoute(response, { ...options, url: matcher });
        else if (matcher instanceof URL)
          this._addRoute(response, { ...options, url: matcher });
        else
          this._addRoute(response || matcher.response, {
            ...options,
            ...matcher,
          });
        break;
      default:
        throw new Error(
          `first argument 'matcher' of type ${typeof matcher} unsupported`,
        );
    }

    return this;
  }

  get(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'GET' });
  }

  head(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'HEAD' });
  }

  post(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'POST' });
  }

  put(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'PUT' });
  }

  delete(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'DELETE' });
  }

  patch(matcher, response, options) {
    return this.mock(matcher, response, { ...options, method: 'PATCH' });
  }

  once(matcher, response, options) {
    return this.mock(matcher, response, { ...options, repeat: 1 });
  }

  any(response, options) {
    return this.mock(() => true, response, options);
  }
}

export default new Mock(axios);
