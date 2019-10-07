<template>
    <div id="wrapper">
        <main>
            <div>HOLA</div>
        </main>
    </div>
</template>

<script>
import crypt from '../logic/crypt'
import path from 'path'
import fs from 'fs'
import { Environment } from 'storj'
import async from 'async'

export default {
  name: 'xcloud-page',
  data () {
    return {
      bridgeInstance: null,
      queue: async.queue(function (task, callback) {
        console.log('Queue new download', task.filePath)
        const bucketId = task.bucketId
        const fileId = task.fileId
        const filePath = task.filePath

        const storj = task.environment
        const fileExists = fs.existsSync(filePath)

        if (fileExists) {
          fs.unlinkSync(filePath)
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
          console.log('Error downloading file', filePath)
          callback()
        }
      }, 3)
    }
  },
  components: { },
  created: function () {
    const userData = JSON.parse(localStorage.getItem('xUser'))
    fetch(`${process.env.API_URL}/storage/tree`, {
      headers: { 'Authorization': `Bearer ${userData.token}` }
    }).then(async res => {
      return { res, data: await res.json() }
    }).then(res => {
      console.log(res)
      // pullAllDirs loops recursively each dir and downloads its files
      this.pullAllDirs(res.data)
      // At the end, download root files
      this.pullAllFiles(res.data, localStorage.getItem('xPath'))
    }).catch(err => {
      console.log(err)
    })
  },
  methods: {
    pullAllDirs (obj, lastDir = null) {
      obj.children && obj.children.forEach(dir => {
        let decryptedName = crypt.DecryptName(dir.name, dir.parentId)
        let fullNewPath = path.join(lastDir || localStorage.getItem('xPath'), decryptedName)

        // console.log('Dir to pull', fullNewPath)

        try {
          fs.mkdirSync(fullNewPath)
        } catch (e) {
          // console.log('Cannot create', fullNewPath)
        }

        this.pullAllFiles(dir, fullNewPath)

        this.pullAllDirs(dir, fullNewPath)
      })
    },
    pullAllFiles (obj, localPath) {
      console.log('pullAllFiles', obj.files)
      obj.files.forEach(file => {
        const fileName = crypt.DecryptName(file.name, file.folder_id + '') + '.' + file.type
        const filePath = path.join(localPath, fileName)

        console.log('File to pull:', filePath)

        const task = {
          environment: this.getEnvironment(),
          fileId: file.fileId,
          bucketId: file.bucket,
          filePath: filePath
        }

        this.$data.queue.push(task)
      })
    },
    createFolders (obj) {

    },
    getEnvironment () {
      if (this.$data.bridgeInstance) {
        return this.$data.bridgeInstance
      }
      const userInfo = JSON.parse(localStorage.getItem('xUser')).user
      const mnemonic = localStorage.getItem('xMnemonic')

      const options = {
        bridgeUrl: process.env.BRIDGE_URL,
        bridgeUser: userInfo.email,
        bridgePass: userInfo.userId,
        encryptionKey: mnemonic
      }

      const storj = new Environment(options)

      this.$data.bridgeInstance = storj
      return storj
    }
  }
}
</script>