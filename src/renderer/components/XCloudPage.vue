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
import fs from 'fs'
import { Environment } from 'storj'
import async from 'async'
import database from '../../database/index'
// eslint-disable-next-line no-unused-vars
import { diff, addedDiff, deletedDiff, updatedDiff, detailedDiff } from 'deep-object-diff'

export default {
  name: 'xcloud-page',
  data () {
    return {
      bridgeInstance: null,
      queue: null
    }
  },
  components: { },
  created: async function () {
    const userData = JSON.parse(await database.Get('xUser'))
    fetch(`${process.env.API_URL}/storage/tree`, {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    }).then(async res => {
      return { res, data: await res.json() }
    }).then(async res => {
      await database.Set('tree', res)
      // pullAllDirs loops recursively each dir and downloads its files
      this.pullAllDirs(res.data)

      // At the end, download root files
      this.pullAllFiles(res.data, await database.Get('xPath'))
      await database.FolderSet(await database.Get('xPath'), res.data)
    }).catch(err => {
      console.log(err)
    })
  },
  methods: {
    pullAllDirs (obj, lastDir = null) {
      obj.children && obj.children.forEach(async dir => {
        let decryptedName = crypt.DecryptName(dir.name, dir.parentId)
        let fullNewPath = path.join(lastDir || await database.Get('xPath'), decryptedName)
        console.log('pullAllDirs', fullNewPath)
        await database.FolderSet(fullNewPath, dir)

        try {
          fs.mkdirSync(fullNewPath)
        } catch (e) {
        }

        this.pullAllFiles(dir, fullNewPath)

        this.pullAllDirs(dir, fullNewPath)
      })
    },
    pullAllFiles (obj, localPath) {
      obj.files.forEach(async file => {
        const fileName = crypt.DecryptName(file.name, file.folder_id + '') + '.' + file.type
        const filePath = path.join(localPath, fileName)
        await database.FileSet(filePath, file)

        const task = {
          environment: await this.getEnvironment(),
          fileId: file.fileId,
          bucketId: file.bucket,
          filePath: filePath
        }

        this.getQueue().push(task)
      })
    },
    createFolders (obj) {

    },
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
    async startWatcher () {
    },
    getQueue () {
      if (this.$data.queue) {
        return this.$data.queue
      } else {
        let newQueue = async.queue(function (task, callback) {
          const bucketId = task.bucketId
          const fileId = task.fileId
          const filePath = task.filePath

          const storj = task.environment
          const fileExists = fs.existsSync(filePath)

          if (fileExists) {
            return callback()
          }

          try {
            storj.resolveFile(bucketId, fileId, filePath, {
              progressCallback: function (progress, downloadedBytes, totalBytes) {
                console.log('progress:', progress)
              },
              finishedCallback: function (err) {
                if (err) {
                  throw err
                } else {
                  console.log('File download complete')
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
    }
  }
}
</script>