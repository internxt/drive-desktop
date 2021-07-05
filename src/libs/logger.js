import log from 'electron-log'

let Logger = console

log.transports.file.maxSize = 1048576 * 150 // 150MB

if (process.env.NODE_ENV === 'production') {
  Logger = log
}

export default Logger
