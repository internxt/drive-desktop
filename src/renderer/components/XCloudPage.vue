<template>
  <div id="wrapper">
    <main>
      <div class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </main>
  </div>
</template>

<script>
import crypt from '../logic/crypt'
import path from 'path'
import temp from 'temp'
import fs, { existsSync } from 'fs'
import { Environment } from 'storj'
import async from 'async'
import database from '../../database/index'
import Sync from '../logic/sync'
import Tree from '../logic/tree'
import Monitor from '../logic/monitor'
import { remote } from 'electron'

export default {
  name: 'xcloud-page',
  data () {
    return {
      bridgeInstance: null,
      queue: null
    }
  },
  components: {},
  mounted: function () {
    remote.BrowserWindow.getFocusedWindow().minimize()
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
  },
  methods: {
    async getEnvironment () {
      if (this.$data.bridgeInstance) {
        return this.$data.bridgeInstance
      }

      const userInfo = (await database.Get('xUser')).user
      const mnemonic = await database.Get('xMnemonic')

      const options = {
        bridgeUrl: process.env.BRIDGE_URL,
        bridgeUser: userInfo.email,
        bridgePass: userInfo.userId,
        encryptionKey: mnemonic
      }

      const storj = new Environment(options)

      this.$data.bridgeInstance = storj
      return storj
    },
    getQueue () {
      if (this.$data.queue) {
        return this.$data.queue
      } else {
        const checkFile = this.checkFile
        let newQueue = async.queue(function (task, callback) {
          const bucketId = task.bucketId
          const fileId = task.fileId
          const filePath = task.filePath
          const fileObj = task.fileObj

          const storj = task.environment
          const fileExists = fs.existsSync(filePath)

          if (fileExists) {
            return checkFile(fileObj, filePath, callback)
          }

          try {
            storj.resolveFile(bucketId, fileId, filePath, {
              progressCallback: function (
                progress,
                downloadedBytes,
                totalBytes
              ) {
                console.log('progress:', progress)
              },
              finishedCallback: async function (err) {
                if (err) {
                  throw err
                } else {
                  console.log('File download complete from queue')
                  await Sync.SetModifiedTime(filePath, fileObj.created_at)
                }
                callback()
              }
            })
          } catch (e) {
            console.log('Error downloading file', filePath, e)
            callback()
          }
        }, 3)

        this.$data.queue = newQueue

        newQueue.drain(() => {
          this.checkLocalFiles()
        })

        return newQueue
      }
    },
    async checkLocalFiles () {
      console.log('Start checking local files')
      const localPath = await database.Get('xPath')
      const arbol = Tree.GetListFromFolder(localPath)
      const storj = await this.getEnvironment()
      async.eachSeries(arbol, async function (item, next) {
        var stat = Tree.GetStat(item)
        if (stat.isFile()) {
          let entry = await database.FileGet(item)
          if (!entry) {
            console.log('New local file:', item)
            await Sync.UploadNewFile(storj, item)
            next()
          } else {
            next()
          }
        } else {
          let entry = await database.FolderGet(item)
          if (!entry) {
            console.log('New local folder:', item)
          }
          next()
        }
      }, (err, result) => {
        console.log(err, 'FIN')
        Sync.CheckMissingFolders()
      })
    }
  }
}
</script>