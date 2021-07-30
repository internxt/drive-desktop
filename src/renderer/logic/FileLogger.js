import fs from 'fs'
import path from 'path'
import Logger from '../../libs/logger'
import EventEmitter from 'events'
class FileLogger extends EventEmitter {
  constructor(maxSize = 50) {
    super()
    this.maxSize = maxSize
    this.queue = new Array(maxSize)
    this.head = 0
  }

  push(item) {
    if (!item.filePath) {
      return
    }
    if (this.queue[this.head] == null) {
      // Create First record in Logger
      this.queue[this.head] = item
      this.emit('new-entry', this.getHead())
      // this.emit('new-emit', this.getAll())
    } else if (item.filePath === this.queue[this.head].filePath) {
      try {
        // Update the last record in Logger
        if (!item.progress && !item.state) {
          this.queue[this.head] = item
        } else {
          Object.assign(this.queue[this.head], item)
        }
        this.emit('update-last-entry', this.getHead())
      } catch (err) {
        Logger.error(err)
      }
    } else {
      // Create a new record in Logger
      this.head = (this.head + 1) % this.maxSize
      this.queue[this.head] = item
      this.emit('new-entry', this.getHead())
    }
  }

  getAll() {
    const queue = this.queue
      .slice()
      .reverse()
      .filter(e => {
        return e != null
      })
    const head = queue.slice(this.head, this.maxSize)
    const tail = queue.slice(0, this.head)
    const orderedItems = head.concat(tail)
    return orderedItems
  }
  getQueue() {
    const queue = this.queue
      .slice()
      .reverse()
      .filter(e => {
        return e != null
      })
    return queue
  }

  getHead() {
    return this.queue[this.head]
  }

  clearLogger() {
    this.queue.splice(0, this.queue.length)
  }

  saveLogger() {
    try {
      const jsonQueue = JSON.stringify(this.getAll())
      fs.writeFileSync(path.join(__dirname, '../../../database/fileLogger/fileLogger.json'), jsonQueue)
      console.log(path.join(__dirname, '../../../database/fileLogger/fileLogger.json'))
    } catch (err) {
      Logger.error(err)
    }
  }

  loadLogger() {
    try {
      const savedLogger = require('../../../database/fileLogger/fileLogger.json')
      this.queue = savedLogger
    } catch (err) {
      this.queue = []
    }
    return this.queue
  }
}

export default new FileLogger()
