class FileLogger {
  constructor(maxSize = 50) {
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = -1
  }

  add(item) {
    /*
    const item = {
      path: path,
      name: name,
      action: action,
      state: state,
      percentage: percent,
      description: description
    }
    */
    const head = this.queue[this.head]
    if (head && head.path === item.path) {
      // update the element
      this.queue[this.head] = item
    } else {
      this.head = (this.head + 1) % this.maxSize
      this.queue[this.head] = item
    }
    return item
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
