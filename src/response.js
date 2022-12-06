import axios from 'axios';
import { httpstatus } from './httpstatus';

const AxiosError = axios.AxiosError;

// variant for up to axios 0.26.1
function createError_0_26_1(response) {
  const message = `Request failed with status code ${response.status}`;
  var error = new Error(message);

  error.config = response.config;
  error.request = response.request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null,
    };
  };
  return error;
}

// variant for versions starting from axios 0.27.2
const createError_0_27_2 = (response) => {
  return new AxiosError(
    'Request failed with status code ' + response.status,
    [AxiosError.ERR_BAD_REQUEST, AxiosError.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
    response.config,
    response.request,
    response,
  );
};

const createError = (response) => {
  if (axios.AxiosError) {
    return createError_0_27_2(response);
  } else {
    return createError_0_26_1(response);
  }
};

export const settle = (resolve, reject, response) => {
  const validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(response));
  }
};

const responseFromStatusCode = (statusCode, config) => ({
  data: null,
  status: statusCode,
  statusText: httpstatus[statusCode],
  headers: config.headers,
  config: config,
  request: config.request,
});

const responseWithData = (data, config) => ({
  data: data,
  status: 200,
  statusText: 'OK',
  headers: config.headers,
  config: config,
  request: config.request,
});

const ensureAxiosResponseProps = (response, config) => ({
  data: 'data' in response ? response.data : null,
  status: response.status,
  statusText: response.statusText,
  headers: 'headers' in response ? response.headers : config.headers,
  config: config,
  request: config.request,
});

const isResponse = (obj) => 'status' in obj && 'statusText' in obj;

export const deriveResponse = (responseDeclaration, config) => {
  switch (typeof responseDeclaration) {
    case 'function':
      return deriveResponse(responseDeclaration(config), config);
    case 'number':
      return responseFromStatusCode(responseDeclaration, config);
    case 'string':
      return responseWithData(responseDeclaration, config);
    case 'object':
      // todo: distinguish between objects that represent DATA, or are PROMISE interface, or are RESPONSE interface
      return isResponse(responseDeclaration)
        ? ensureAxiosResponseProps(responseDeclaration, config)
        : responseWithData(responseDeclaration, config);
    default:
      throw new Error(`type ${typeof responseDeclaration} of response declaration is not supported`);
  }
};
