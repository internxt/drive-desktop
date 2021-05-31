class FileLogger {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = -1
  }

  isToUpdate(item) {
    const head = this.queue[this.head]
    return head && head.filePath === item.filePath && !item.state && !item.action
  }

  add(item) {
    if (this.isToUpdate(item)) {
      // update the element (it is uploading or downloading)
      Object.assign(this.queue[this.head], item)
    } else {
      this.head = (this.head + 1) % this.maxSize
      this.queue[this.head] = item
    }
    return this.queue[this.head]
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
