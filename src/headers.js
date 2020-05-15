const shallowKeysToLowerCase = (hash) => {
  const res = {};
  for (let key in Object.keys(hash)) {
    res[key.toLowerCase()] = hash[key];
  }

  return res;
};

export const isHeadersSubset = (actualHeaders, expectedHeaders) => {
  const subset = shallowKeysToLowerCase(expectedHeaders);
  const superset = shallowKeysToLowerCase(actualHeaders);

  for (let [key, value] of Object.entries(subset)) {
    if (superset[key] !== value) return false;
  }

  return true;
};

//     const expectedHeaders = new Headers(route.criteria.headers);
//     const actualHeaders = new Headers(config.headers);
//     for (let [headerName] of expectedHeaders) {
//       if (!actualHeaders.has(headerName)) return false;
//     }

// for (let [key, value] of Object.entries(route.criteria.headers)) {
//   todo: match keys case insensitive
//   if (config.headers[key] !== value) return false;
// }
