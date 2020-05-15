import axios from "axios";

const instance = axios.create();

export let axiosVersion_below_0_13_0 = true;

instance.defaults.adapter = () => {
  axiosVersion_below_0_13_0 = arguments.length === 3;
  return new Promise((resolve, reject) => {
    reject();
  });
};
instance.get("test").catch(() => {});
