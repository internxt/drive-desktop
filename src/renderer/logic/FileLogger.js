const EventEmitter = require('events')

class FileLogger extends EventEmitter {
  constructor(maxSize = 50) {
    super()
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = -1
  }

  add(item) {
    this.head = (this.head + 1) % this.maxSize
    this.queue[this.head] = item
    this.emit('item-added', item)
  }

  getAll() {
    const queue = this.queue.slice().reverse()
    const head = queue.slice(this.head, this.maxSize)
    const tail = queue.slice(0, this.head)
    const orderedItems = head.concat(tail)
    return orderedItems
  }
}

module.exports = new FileLogger()
