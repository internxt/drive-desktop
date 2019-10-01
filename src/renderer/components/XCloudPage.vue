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

export default {
  name: 'xcloud-page',
  data () {
    return {
      bridgeInstance: null
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
      this.pullAllDirs(res.data)
    }).catch(err => {
      console.log(err)
    })
  },
  methods: {
    pullAllDirs (obj, lastDir = null) {
      obj.children && obj.children.forEach(dir => {
        let decryptedName = crypt.DeterministicDecryption(dir.name, dir.parentId)
        let fullNewPath = path.join(lastDir || localStorage.getItem('xPath'), decryptedName)

        try {
          fs.mkdirSync(fullNewPath)
        } catch (e) {
          // console.log('Error creating folder', e)
        }

        this.pullAllFiles(dir, fullNewPath)

        this.pullAllDirs(dir, fullNewPath)
      })
    },
    pullAllFiles (obj, localPath) {
      // const storj = this.getEnvironment()

      obj.files.forEach(file => {
        const fileName = crypt.DecryptName(file.name, file.folder_id + '') + '.' + file.type
        const filePath = path.join(localPath, fileName)

        const storj = this.getEnvironment()

        console.log(filePath, fs.existsSync(filePath))

        storj.resolveFile(file.bucket, file.fileId, filePath, {
          progressCallback: function (progress, downloadedBytes, totalBytes) {
            console.log('progress:', progress)
          },
          finishedCallback: function (err) {
            if (err) {
              return console.error(err)
            }
            console.log('File download complete')
          }
        })
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