const fetch: typeof window.fetch =
  process.type === 'renderer'
    ? window.fetch
    : require('electron-fetch').default;

let userIsUnauthorized: () => void;

if (window.electron.userIsUnauthorized) {
  userIsUnauthorized = window.electron.userIsUnauthorized;
} else if (process.type === 'renderer') {
  userIsUnauthorized = () => {
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('user-is-unauthorized');
  };
} else {
  userIsUnauthorized = require('../main/main').userIsUnauthorized;
}

const httpRequest: typeof fetch = (...args) => {
  return fetch(...args).then((res) => {
    if (res.status === 401) {
      userIsUnauthorized();
    }
    return res;
  });
};

export default httpRequest;
