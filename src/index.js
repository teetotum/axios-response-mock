import axios from 'axios';
import { Mock } from './mock';

const instances = [];

export const create = (axiosInstance) => {
  const mock = new Mock(axiosInstance || axios);
  instances.push(mock);
  return mock;
};

export const restoreAll = () => {
  instances.forEach((mock) => mock.restore());
};

const base = { create, restoreAll };
export default base;
