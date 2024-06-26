import test from 'tape';
import axios from 'axios';
import isEqual from 'lodash/isEqual';
import responseMockBase from '../src/index';

// const g = global || self;

// g.self = g.self || {};
// g.self.location = g.self.location || {
//   protocol: 'http:',
//   hostname: 'example.org',
// };

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

test(
  "'query' matcher matches URL params in the axios 'params' options",
  testcase(
    { query: { foo: 'bar' } },
    {
      url: 'http://example.org',
      method: 'post',
      headers: { Accept: 'application/json, text/plain, */*' },
      params: { foo: 'bar' },
      data: { some: 'thing' },
    },
    'mockresponse',
    (res) => res.data === 'mockresponse',
  ),
);

test(
  "'query' matcher correctly deals with multiple URL params with the same name - in URL string",
  testcase(
    { query: { foo: '2' } },
    {
      url: 'http://example.org?foo=1&foo=2',
      method: 'post',
      headers: { Accept: 'application/json, text/plain, */*' },
      params: { foo: '3' },
      data: { some: 'thing' },
    },
    'mockresponse',
    (res) => res.data === 'mockresponse',
  ),
);

test(
  "'query' matcher correctly deals with multiple URL params with the same name - in axios 'params' options",
  testcase(
    { query: { foo: '3' } },
    {
      url: 'http://example.org?foo=1&foo=2',
      method: 'post',
      headers: { Accept: 'application/json, text/plain, */*' },
      params: { foo: '3' },
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
  'response is string (data)',
  withResponse('bees buzz around', (res) => res.data === 'bees buzz around' && res.status === 200),
);

test(
  'response is number 200 (status)',
  withResponse(200, (res) => res.status === 200),
);
test(
  'response is number 201 (status)',
  withResponse(201, (res) => res.status === 201),
);

test(
  'response is number: status code 204 with matching message',
  withResponse(204, (res) => res.statusText === 'No Content'),
);

test(
  'response is function (data)',
  withResponse(
    () => 'foobar',
    (res) => res.data === 'foobar' && res.status === 200,
  ),
);

test(
  'response is object (payload data)',
  withResponse(pinocchioData, (res) => isEqual(res.data, pinocchioData) && res.status === 200),
);

test(
  'response is object (response object)',
  withResponse(
    { status: 299, statusText: 'Quetzalcoatl', data: 'abc' },
    (res) => res.status === 299 && res.statusText === 'Quetzalcoatl' && res.data === 'abc',
  ),
);

const relURL =
  ({ matcher, axiosOptions, expectPassthrough }) =>
  async (assert) => {
    const axiosInstance = axios.create(axiosOptions);
    axiosInstance.defaults.adapter = (conf) =>
      new Promise((resolve, reject) => {
        resolve({
          data: 'PASSTHROUGH',
          status: 200,
          statusText: 'OK',
          headers: {},
          config: conf,
          request: conf.request,
        });
      });

    const mockInstance = responseMockBase.create(axiosInstance);

    const expectedResponseData = 'lorem ipsum';
    mockInstance.mock(matcher, expectedResponseData);

    if (expectPassthrough) {
      assert.plan(1);
      try {
        const response = await axiosInstance.request({
          url: 'http://example.org/test/path',
          method: 'get',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'X-Custom-Header': 'foobar',
          },
          params: {
            ID: 12345,
            foo: 'bar',
          },
        });

        assert.equal(response.data, 'PASSTHROUGH');
        assert.end();
      } catch (e) {
        assert.fail(e);
      }
    } else {
      assert.plan(2);
      try {
        const response = await axiosInstance.request({
          url: 'http://example.org/test/path',
          method: 'get',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'X-Custom-Header': 'foobar',
          },
          params: {
            ID: 12345,
            foo: 'bar',
          },
        });
        assert.equal(response.data, expectedResponseData);
        assert.equal(response.status, 200);
        assert.end();
      } catch (e) {
        assert.fail(e);
      }
    }
  };

test('matcher with relative URL - without baseURL', relURL({ matcher: 'test/path', expectPassthrough: true }));
test(
  'matcher with relative URL - with baseURL',
  relURL({ matcher: 'test/path', axiosOptions: { baseURL: 'http://example.org/' } }),
);
