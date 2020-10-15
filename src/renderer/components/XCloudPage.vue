<template>
  <div id="wrapper">
    <main>
      <div class="spinner-border text-primary" role="status">
        <span class="sr-only"></span>
      </div>
      <div>{{ toolTip ? toolTip : 'Paused' }}</div>
      <div>
        <a href="#" @click="quitApp()">Quit</a>
      </div>
      <div>
        <a href="#" @click="forceSync()">Force sync</a>
      </div>
      <div>
        <a href="#" @click="logout()">Log out</a>
      </div>
      <div>
        Path:
        <a href="#" @click="openFolder()">{{this.$data.localPath}}</a>
      </div>
    </main>
  </div>
</template>

<script>
import crypt from '../logic/crypt'
import path from 'path'
import temp from 'temp'
import fs, { existsSync } from 'fs'
import async from 'async'
import database from '../../database/index'
import Sync from '../logic/sync'
import Uploader from '../logic/Uploader'
import Tree from '../logic/tree'
import Monitor from '../logic/monitor'
import { remote } from 'electron'
import Logger from '../../libs/logger'
import PackageJson from '../../../package.json'

export default {
  name: 'xcloud-page',
  data() {
    return {
      databaseUser: '',
      localPath: '',
      currentEnv: '',
      isSyncing: false,
      toolTip: ''
    }
  },
  components: {},
  beforeCreate() {
    remote.app.emit('window-hide')
    database
      .Get('xUser')
      .then((xUser) => {
        const userEmail = xUser.user.email
        remote.app.emit('update-menu', userEmail)
        Logger.info(
          'Account: %s, User platform: %s %s, version: %s',
          userEmail,
          process.platform,
          process.arch,
          PackageJson.version
        )
      })
      .catch((err) => {
        console.log('Cannot update tray icon', err.message)
      })
  },
  created: function () {
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
    this.getLocalFolderPath()
    this.getCurrentEnv()

    remote.app.on('set-tooltip', (text) => {
      this.toolTip = text
    })

    remote.app.on('user-logout', () => {
      remote.app.emit('sync-stop')
      database
        .ClearAll()
        .then(() => {
          Logger.info('databases cleared due to log out')
          database
            .ClearUser()
            .then(() => {
              database.CompactAllDatabases()
              remote.app.emit('update-menu')
              this.$router.push('/').catch(() => {})
            })
            .catch((err) => {
              Logger.error('ERROR CLEARING USER', err)
            })
        })
        .catch(() => {
          Logger.error('ERROR CLEARING ALL')
        })
    })

    remote.app.on('new-folder-path', async (newPath) => {
      remote.app.emit('sync-stop')
      await database.ClearAll()
      database.Set('xPath', newPath)
      this.$router.push('/').catch(() => {})
    })
  },
  methods: {
    quitApp() {
      remote.app.emit('app-close')
    },
    openFolder() {
      remote.app.emit('open-folder')
    },
    logout() {
      remote.app.emit('user-logout')
    },
    forceSync() {
      remote.app.emit('sync-start')
    },
    changeTrayIconOn() {
      remote.app.emit('sync-on')
    },
    changeTrayIconOff() {
      remote.app.emit('sync-off')
    },
    getUser() {},
    getLocalFolderPath() {
      database
        .Get('xPath')
        .then((path) => {
          this.$data.localPath = path
        })
        .catch((err) => {
          console.error(err)
          this.$data.localPath = 'error'
        })
    },
    getCurrentEnv() {
      this.$data.currentEnv = process.env.NODE_ENV
    }
  }
}
</script>