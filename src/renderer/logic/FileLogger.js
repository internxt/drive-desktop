import { EventEmitter } from 'events'

class FileLogger extends EventEmitter {
  constructor(maxSize = 50) {
    super()
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = -1
    // dictionary = {path: string, position: number} look up table
    this.dictionary = {}
  }

  exists(item) {
    if (this.dictionary[item.path]) {
      return true
    } else {
      return false
    }
  }

  add(item) {
    if (this.exists(item)) {
      // update the queue but do not move the head
      this.update(item)
      this.emit('item-updated', item)
    } else {
      this.head = (this.head + 1) % this.maxSize
      this.dictionary[item.path] = this.head
      this.queue[this.head] = item
      this.emit('item-added', item)
    }
  }

  // private
  update(item) {
    this.queue[this.dictionary[item.path]] = item
  }

  getLogger() {
    if (this.head == -1) return []
    let counter = this.head
    const queue = []
    do {
      queue.push(this.queue[counter])
      if (--counter < 0) {
        counter = this.maxSize - 1
      }
    } while (counter != this.head)
    return 1
  }

  get(item) {
    const pos = this.dictionary[item.path]
    return this.queue[pos]
  }
}
