import isSubset from 'is-subset';
import isEqual from 'lodash/isEqual';
import { isHeadersSubset } from './headers';

const toURL = (urlString) => {
  const location = self.location;
  const baseUrl = location.protocol + '//' + location.hostname + '/';
  return new URL(urlString, baseUrl);
};

// configParams are in the form of:
// {
//    ID: 12345,
//    foo: 'bar',
// },
//
const combineParams = (configParams = {}, configUrl) => {
  const urlSearchParams = toURL(configUrl).searchParams;
  const configUrlParamsEntries = [...urlSearchParams.entries()];
  const configParamsEntries = Object.entries(configParams);
  return [...configUrlParamsEntries, ...configParamsEntries];
};

const isArraySubset = (superset, subset) =>
  subset.every(([k, v]) => Boolean(superset.find(([entryKey, entryValue]) => k === entryKey && v === entryValue)));

export const matchesAllCriteria = (route, config) => {
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
  if (route.criteria.method && route.criteria.method.toLowerCase() !== config.method.toLowerCase()) {
    return false;
  }

  // TODO: URL might not be supported by IE11
  // check url
  if (route.criteria.url) {
    if (typeof route.criteria.url === 'string') {
      if (toURL(route.criteria.url).href !== toURL(config.url).href) return false;
    } else {
      if (route.criteria.url instanceof RegExp) {
        if (!route.criteria.url.test(config.url)) return false;
      }

      if (route.criteria.url instanceof URL) {
        if (route.criteria.url.href !== toURL(config.url).href) return false;
      }
    }
  }

  // check headers
  if (route.criteria.headers) {
    if (!isHeadersSubset(config.headers, route.criteria.headers)) return false;
  }

  // check query
  if (route.criteria.query) {
    if (!isArraySubset(combineParams(config.params, config.url), Object.entries(route.criteria.query))) return false;
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
