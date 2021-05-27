class FileLogger {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = -1
  }

  add(item) {
    this.head = (this.head + 1) % this.maxSize
    this.queue[this.head] = item
  }

  getAll() {
    const queue = this.queue.slice().reverse()
    const head = queue.slice(this.head, this.maxSize)
    const tail = queue.slice(0, this.head)
    const orderedItems = head.concat(tail)
    return orderedItems
  }
}

export default new FileLogger()
