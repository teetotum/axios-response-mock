import test from 'tape';
import axios from 'axios';
import isEqual from 'lodash/isEqual';
import responseMockBase from '../src/index';

const g = global || self;

g.self = g.self || {};
g.self.location = g.self.location || {
  protocol: 'http:',
  hostname: 'example.org',
};

const pinocchioData = {
  name: 'Pinocchio',
  parts: [
    {
      partName: 'nose',
      quantity: 1,
    },
    {
      partName: 'hand',
      quantity: 2,
    },
  ],
};

const testcase = (matcher, request, response, assertResponseIsAsExpected, axiosOptions) => async (assert) => {
  const axiosInstance = axios.create(axiosOptions);
  const mockInstance = responseMockBase.create(axiosInstance);
  assert.plan(1);
  mockInstance.mock(matcher, response);
  try {
    const res = await axiosInstance.request(request);
    assert.true(assertResponseIsAsExpected(res));
    assert.end();
  } catch (e) {
    assert.fail(e);
  }
};

test(
  "'query' matcher matches URL params in the request URL string",
  testcase(
    { query: { foo: 'bar' } },
    {
      url: 'http://example.org?foo=bar',
      method: 'post',
      headers: { Accept: 'application/json, text/plain, */*' },
      data: { some: 'thing' },
    },
    'mockresponse',
    (res) => res.data === 'mockresponse',
  ),
);

const withMatcherAndParams = (matcher) => async (assert) => {
  const axiosInstance = axios.create();
  const mockInstance = responseMockBase.create(axiosInstance);
  assert.plan(2);
  const expectedResponseData = 'lorem ipsum';
  mockInstance.mock(matcher, expectedResponseData);

  try {
    const response = await axiosInstance.request({
      url: 'http://example.org?foo=bar',
      method: 'post',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Custom-Header': 'foobar',
      },
      params: {
        ID: 12345,
      },
      data: {
        firstName: 'Fred',
        lastName: 'Flintstone',
      },
    });
    assert.equal(response.data, expectedResponseData);
    assert.equal(response.status, 200);
    assert.end();
  } catch (e) {
    assert.fail(e);
  }
};

const withMatcher = (matcher) => async (assert) => {
  const axiosInstance = axios.create();
  const mockInstance = responseMockBase.create(axiosInstance);
  assert.plan(2);
  const expectedResponseData = 'lorem ipsum';
  mockInstance.mock(matcher, expectedResponseData);

  try {
    const response = await axiosInstance.request({
      url: 'http://example.org',
      method: 'post',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Custom-Header': 'foobar',
      },
      params: {
        ID: 12345,
        foo: 'bar',
      },
      data: {
        firstName: 'Fred',
        lastName: 'Flintstone',
      },
    });
    assert.equal(response.data, expectedResponseData);
    assert.equal(response.status, 200);
    assert.end();
  } catch (e) {
    assert.fail(e);
  }
};

const withResponse = (response, isAsExpected) => async (assert) => {
  const axiosInstance = axios.create();
  const mockInstance = responseMockBase.create(axiosInstance);
  assert.plan(1);

  mockInstance.mock('http://example.org', response);

  try {
    const res = await axiosInstance.request({
      url: 'http://example.org',
      method: 'post',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'X-Custom-Header': 'foobar',
      },
      params: {
        ID: 12345,
        foo: 'bar',
      },
      data: {
        firstName: 'Fred',
        lastName: 'Flintstone',
      },
    });
    assert.true(isAsExpected(res));
    assert.end();
  } catch (e) {
    assert.fail(e);
  }
};

test('regex matcher', withMatcher(/http\:\/\/example\.org/));
test('string matcher', withMatcher('http://example.org'));
test('URL matcher', withMatcher(new URL('http://example.org')));
test(
  'function matcher',
  withMatcher((config) => config.url.includes('example')),
);
test(
  'exact body matcher',
  withMatcher({
    body: {
      firstName: 'Fred',
      lastName: 'Flintstone',
    },
  }),
);
test(
  'partial body matcher',
  withMatcher({
    matchPartialBody: true,
    body: {
      firstName: 'Fred',
    },
  }),
);
test(
  'headers matcher',
  withMatcher({
    headers: { 'X-Custom-Header': 'foobar' },
  }),
);
test(
  'headers matcher, case-insensitive',
  withMatcher({
    headers: { 'x-cUstom-header': 'foobar' },
  }),
);

test(
  'query matcher: options.params',
  withMatcher({
    query: { foo: 'bar' },
  }),
);

test(
  'query matcher: URL parameters',
  withMatcherAndParams({
    query: { foo: 'bar' },
  }),
);

test('string matcher with URL parameters', withMatcherAndParams('http://example.org?foo=bar'));
test('URL matcher with URL parameters', withMatcherAndParams(new URL('http://example.org?foo=bar')));

test(
  'string (data) response',
  withResponse('bees buzz around', (res) => res.data === 'bees buzz around' && res.status === 200),
);

test(
  'number 200 (status) response',
  withResponse(200, (res) => res.status === 200),
);
test(
  'number 201 (status) response',
  withResponse(201, (res) => res.status === 201),
);

test(
  'status code 204 response with matching message',
  withResponse(204, (res) => res.statusText === 'No Content'),
);

test(
  'function (data) response',
  withResponse(
    () => 'foobar',
    (res) => res.data === 'foobar' && res.status === 200,
  ),
);
test(
  'object (data) response',
  withResponse(pinocchioData, (res) => isEqual(res.data, pinocchioData) && res.status === 200),
);
