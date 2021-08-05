import fs from 'fs'
import path from 'path'
import Logger from '../../libs/logger'
import EventEmitter from 'events'
import { MenuItem } from 'electron'
class FileLogger extends EventEmitter {
  constructor(maxSize = 100) {
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
      this.queue[this.head]['date'] = Date() // Date of update
      this.emit('new-entry', this.getHead())
      // this.emit('new-emit', this.getAll())
    } else if (item.filePath === this.queue[this.head].filePath) {
      try {
        // Update the last record in Logger
        Object.assign(this.queue[this.head], item)
        this.queue[this.head]['date'] = Date() // Date of update
        if (!item.progress && !item.state) {
          this.queue[this.head]['state'] = ''
        }
        /*
        if (!item.progress && !item.state) {
          this.queue[this.head] = MenuItem
        } else {
          Object.assign(this.queue[this.head], item)
        }
        */
        this.emit('update-last-entry', this.getHead())
      } catch (err) {
        Logger.error(err)
      }
    } else {
      // Create a new record in Logger
      this.head = (this.head + 1) % this.maxSize
      this.queue[this.head] = item
      this.queue[this.head]['date'] = Date() // Date of update
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

  eraseQueue() {
    this.queue = new Array(this.maxSize)
    this.head = 0
  }

  getHead() {
    return this.queue[this.head]
  }

  saveLog() {
    if (!this.getQueue().length > 0) {
      // Filelogger log is empty, there is nothing to save
      return
    }
    // var content = JSON.stringify(this.getAll())
    var content = JSON.stringify(this.getQueue().reverse())
    var filepath = path.join(__dirname, '../../../database/fileLogger/fileLogger.json')
    fs.writeFile(filepath, content, (err) => {
      if (err) {
        console.log('An error ocurred updating Filelogger.json' + err.message)
        return
      }
      // Filelogger.json succesfully saved
      return true
    })
  }

  eraseLog() {
    if (this.getQueue().length > 0) {
      return
    }
    var filepath = path.join(__dirname, '../../../database/fileLogger/fileLogger.json')
    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => {
        if (err) {
          console.warn('An error ocurred updating Filelogger.json: ' + err.message)
          console.log(err)
          return false
        }
        // Filelogger.json succesfully deleted
      })
    } else {
      console.warn('Filelogger.json does not exist, cannot delete')
    }
  }

  loadLog() {
    var filepath = path.join(__dirname, '../../../database/fileLogger/fileLogger.json')
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        console.log('An error ocurred reading the filelogger log :' + err.message)
        return
      }
      if ((data && data.length > 0 && !(data === [] || data === '[]')) && JSON.parse(data).length >= this.getAll().length) {
        // Loading log
        JSON.parse(data).forEach((item) => {
          this.push(item)
        })
      }
    })
    return true
  }
}

export default new FileLogger()
