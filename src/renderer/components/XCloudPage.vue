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
    this.startSync()
  },
  methods: {
    async startSync () {
      const userData = JSON.parse(await database.Get('xUser'))
      fetch(`${process.env.API_URL}/storage/tree`, {
        headers: { Authorization: `Bearer ${userData.token}` }
      })
        .then(async res => {
          return { res, data: await res.json() }
        })
        .then(async res => {
          await database.Set('tree', res)
          // pullAllDirs loops recursively each dir and downloads its files
          this.pullAllDirs(res.data)

          // At the end, download root files
          this.pullAllFiles(res.data, await database.Get('xPath'))
          await database.FolderSet(await database.Get('xPath'), res.data)
        })
        .catch(err => {
          console.log(err)
        })
    },
    pullAllDirs (obj, lastDir = null) {
      obj.children &&
        obj.children.forEach(async dir => {
          let decryptedName = crypt.DecryptName(dir.name, dir.parentId)
          let fullNewPath = path.join(
            lastDir || (await database.Get('xPath')),
            decryptedName
          )
          await database.FolderSet(fullNewPath, dir)

          try {
            fs.mkdirSync(fullNewPath)
          } catch (e) {}

          this.pullAllFiles(dir, fullNewPath)

          this.pullAllDirs(dir, fullNewPath)
        })
    },
    pullAllFiles (obj, localPath) {
      obj.files.forEach(async file => {
        const fileName =
          crypt.DecryptName(file.name, file.folder_id + '') + '.' + file.type
        const filePath = path.join(localPath, fileName)
        await database.FileSet(filePath, file)

        const task = {
          environment: await this.getEnvironment(),
          fileId: file.fileId,
          bucketId: file.bucket,
          filePath: filePath,
          fileObj: file
        }

        this.getQueue().push(task)
      })
    },
    createFolders (obj) {},
    async getEnvironment () {
      if (this.$data.bridgeInstance) {
        return this.$data.bridgeInstance
      }

      const userInfo = JSON.parse(await database.Get('xUser')).user
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
              .then(r => {
                const mTimeLocal = Sync.GetFileModifiedDate(tempFilePath)
                const mTimeRemote = Sync.GetFileModifiedDate(filePath)

                if (r === true) {
                  console.log('File match, no action required')
                  if (mTimeLocal !== mTimeRemote) {
                    Sync.SetModifiedTime(filePath, fileObj.created_at)
                  }
                  callback()
                } else if (mTimeRemote > mTimeLocal) {
                  // Replace local file with cloud file
                  console.log('Replace local file')
                  fs.unlinkSync(filePath)
                  fs.renameSync(tempFilePath, filePath)
                  callback()
                } else {
                  console.log('Replace remote file')
                  // Upload local file
                  Sync.UploadFile(storj, filePath, callback)
                }
              })
              .catch(err => {
                console.log('Error', err)
                callback(err)
              })
          }
        }
      })
    }
  }
}
</script>