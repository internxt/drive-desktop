import log from 'electron-log'

let Logger = console;

if (process.env.NODE_ENV === 'production') {
    Logger = log
}

export default Logger