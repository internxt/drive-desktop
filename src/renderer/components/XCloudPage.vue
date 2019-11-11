<template>
  <div id="wrapper">
    <main>
      <div>HOLA</div>
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
    this.$app = this.$electron.remote.app
    // this.startSync()
    Monitor.Monitor(true)
  },
  methods: {
    async startSync () {
      const userData = await database.Get('xUser')
      fetch(`${process.env.API_URL}/storage/tree`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      })
        .then(async res => {
          return { res, data: await res.json() }
        })
        .then(async res => {
          await database.Set('tree', res)
          // pullAllDirs loops recursively each dir and downloads its files
          await this.pullAllDirs(res.data)
          // At the end, download root files
          this.pullAllFiles(res.data, await database.Get('xPath'))
          await database.FolderSet(await database.Get('xPath'), res.data)
        })
        .catch(err => {
          console.log(err)
        })
    },
    pullAllDirs (obj, lastDir = null) {
      return new Promise((resolve, reject) => {
        async.eachSeries(obj.children, async (element, next) => {
          let decryptedName = crypt.DecryptName(element.name, element.parentId)
          console.log('PULL ALL DIRS', decryptedName)
          let fullNewPath = path.join(
            lastDir || (await database.Get('xPath')),
            decryptedName
          )
          await database.FolderSet(fullNewPath, element)
          try {
            fs.mkdirSync(fullNewPath)
          } catch (e) {}
          this.pullAllFiles(element, fullNewPath)
          await this.pullAllDirs(element, fullNewPath)
          next()
        }, function (err, result) {
          if (err) {

          }
          resolve()
        })
      })
    },
    pullAllFiles (obj, localPath) {
      const self = this
      return new Promise(function (resolve, reject) {
        async.eachSeries(obj.files,
          async function (element, next) {
            const fileName = crypt.DecryptName(element.name, element.folder_id + '') + '.' + element.type
            const filePath = path.join(localPath, fileName)
            await database.FileSet(filePath, element)

            const task = {
              environment: await self.getEnvironment(),
              fileId: element.fileId,
              bucketId: element.bucket,
              filePath: filePath,
              fileObj: element
            }

            self.getQueue().push(task)
            next()
          }, function (err, result) {
            if (err) { }
          })
      })
    },
    createFolders (obj) {},
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
    async startWatcher () {},
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
    async checkFile (fileObj, filePath, callback) {
      const storj = await this.getEnvironment()

      const tempPath = temp.dir
      const tempFilePath = path.join(tempPath, fileObj.fileId + '.dat')

      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath)
      }

      storj.resolveFile(fileObj.bucket, fileObj.fileId, tempFilePath, {
        progressCallback: function (progress, downloadedBytes, totalBytes) {
          console.log('progress:', progress)
        },
        finishedCallback: function (err) {
          if (err) {
            throw err
          } else {
            // console.log('File download complete from checkfile', tempFilePath, filePath)
            crypt
              .CompareHash(tempFilePath, filePath)
              .then(async r => {
                const mTimeLocal = Sync.GetFileModifiedDate(tempFilePath)
                const mTimeRemote = Sync.GetFileModifiedDate(filePath)

                if (r === true) {
                  console.log('File match, no action required')
                  if (mTimeLocal !== mTimeRemote) {
                    await Sync.SetModifiedTime(filePath, fileObj.created_at)
                  }
                } else if (mTimeRemote > mTimeLocal) {
                  // Replace local file with cloud file
                  console.log('Replace local file')
                  fs.unlinkSync(filePath)
                  fs.renameSync(tempFilePath, filePath)
                } else {
                  console.log('Replace remote file')
                  // Upload local file
                  await Sync.UploadFile(storj, filePath, callback)
                }
                callback()
              })
              .catch(err => {
                console.log('Error', err)
                callback(err)
              })
          }
        }
      })
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