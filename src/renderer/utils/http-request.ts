const httpRequest: typeof fetch = (...args) => {
  return fetch(...args).then((res) => {
    if (res.status === 401) {
      window.electron.userIsUnauthorized();
    }
    return res;
  });
};

export default httpRequest;
