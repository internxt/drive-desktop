import FileLogger from '../FileLogger'
import EventEmitter from 'events'

class Notification extends EventEmitter {
  push(item) {
    const data = FileLogger.add(item)
    this.emit('ui-update', data)
  }

  getHistory() {
    return FileLogger.getAll()
  }
}

export default new Notification()
