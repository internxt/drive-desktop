const { app } =
  process.type === 'renderer'
    ? require('@electron/remote')
    : require('electron')

const fetch =
  process.type === 'renderer' ? window.fetch : require('electron-fetch').default

export function httpRequest(...args) {
  return fetch(...args).then(res => {
    if (res.status === 401) {
      app.emit('logout-entrypoint')
    }
    return res
  })
}
