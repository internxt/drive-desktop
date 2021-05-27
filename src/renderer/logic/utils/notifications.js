import FileLogger from '../FileLogger'
import EventEmitter from 'events'

class Notification extends EventEmitter {
  push(path, name, action, state, percent = null, description = null) {
    const data = {
      path: path,
      name: name,
      action: action,
      state: state,
      percentage: percent,
      description: description
    }
    FileLogger.add(data)
    this.emit('ui-update', data)
  }

  getHistory() {
    return FileLogger.getAll()
  }
}

export default new Notification()
