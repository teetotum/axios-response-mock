import { getAdapter } from 'axios';
import { deriveResponse, settle } from './response';
import { matchesAllCriteria } from './match';

export class Mock {
  constructor(axiosInstance) {
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    axiosInstance.defaults.adapter = this._processRequest.bind(this);
    this.preparedRoutes = [];
  }

  _respond(matchedRoute, config) {
    const response = deriveResponse(matchedRoute.response, config, matchedRoute.responseOptions);
    const delay = matchedRoute.responseOptions.delay;

    return new Promise((resolve, reject) => {
      if (delay) setTimeout(() => settle(resolve, reject, response), delay);
      else settle(resolve, reject, response);
    });
  }

  _processRequest(config) {
    const matchedRoute = this.preparedRoutes.find((route) => matchesAllCriteria(route, config, this.axiosInstance));

    if (matchedRoute) return this._respond(matchedRoute, config);
    else return this._passthrough(config);
  }

  _passthrough(config) {
    if (typeof this.originalAdapter === 'function') {
      return this.originalAdapter(config);
    } else {
      const defaultAdapter = getAdapter(this.originalAdapter);
      return defaultAdapter(config);
    }
  }

  restore() {
    this.axiosInstance.defaults.adapter = this.originalAdapter;
  }

  _addRoute(response, options) {
    if (!response) throw new Error(`argument 'response' invalid: argument is ${response}`);

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
        if (matcher instanceof RegExp) this._addRoute(response, { ...options, url: matcher });
        else if (matcher instanceof URL) this._addRoute(response, { ...options, url: matcher });
        else
          this._addRoute(response || matcher.response, {
            ...options,
            ...matcher,
          });
        break;
      default:
        throw new Error(`first argument 'matcher' of type ${typeof matcher} unsupported`);
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
