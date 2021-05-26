import FileLogger from '../FileLogger'
import EventEmitter from 'events'

class Notification extends EventEmitter {
  push(path, name, action, state, percent = null) {
    const data = {
      path: path,
      name: name,
      state: state,
      percentage: percent
    }
    FileLogger.add(data)
    this.emit('ui-update', data)
  }

  getHistory() {
    return FileLogger.getAll()
  }
}

module.exports = new Notification()
