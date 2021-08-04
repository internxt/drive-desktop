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

  getHead() {
    return this.queue[this.head]
  }

  clearLogger() {
    // this.queue.splice(0, this.queue.length)
    this.queue = new Array(this.maxSize)
    this.head = 0
    this.saveLog(true)
  }

  saveLog(erase) {
    // console.log('%cSAVING LOG...', 'background: red; color: white')
    if (!this.getQueue().length > 0) {
      // console.log('%cFilelogger log is empty, there is nothing to save', 'background: #FCF4D6; color: #8E6A00')
      return
    }
    // var content = JSON.stringify(this.getAll())
    var content = JSON.stringify(this.getQueue().reverse())
    var filepath = path.join(__dirname, '../../../database/fileLogger/fileLogger.json')
    fs.writeFile(filepath, erase ? '' : content, (err) => {
      if (err) {
        console.log('An error ocurred updating the filelogger log' + err.message)
        return
      }
      // console.log('%cFilelogger log succesfully saved', 'background: #DEFBE6; color: #198038')
      return true
    })
  }

  loadLog() {
    // console.log('%cLOADING LOG', 'background: red; color: white')
    var filepath = path.join(__dirname, '../../../database/fileLogger/fileLogger.json')
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        console.log('An error ocurred reading the filelogger log :' + err.message)
        return
      }
      if ((data && data.length > 0 && !(data === [] || data === '[]')) && JSON.parse(data).length >= this.getAll().length) {
        JSON.parse(data).forEach((item) => {
          this.push(item)
        })
      }
    })
    // console.log('%cLOG CONTENT:', 'background: red; color: white', this.queue)
    // return this.queue
    return true
  }
}

export default new FileLogger()
