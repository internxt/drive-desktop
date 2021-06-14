<template>
  <div class="bg-cool-gray-10 overflow:hidden h-full">
   <div class="text-cool-gray-90"></div>

      <Header
      :appName="appName"
      :emailAccount="emailAccount" />

      <FileStatus
      :FileStatusSync="FileStatusSync" />
      <SyncButtonAction  />

      <!-- <div id="selectSyncPanel">
        <input type="checkbox" id="carpeta1" checked="false" />
      </div>

      <div>{{ toolTip ? toolTip : 'Paused' }}</div>
      <div>
        <a href="#" @click="quitApp()">Quitttt</a>
      </div>
      <div>
        <a href="#" @click="forceSync()">Force sync</a>
      </div>
      <div>
        <a href="#" @click="unlockDevice()">Unlock this device</a>
      </div>
      <div>
        <a href="#" @click="getUsage()">Get usage</a>
      </div>
      <div>
        <a href="#" @click="logout()">Log out</a>
      </div>
      <div>
        <a href="#" @click="mysettooltip()">Tool tip</a>
      </div>
      <div>
        <a href="#" @click="stopSync()">Stop Sync</a>
      </div>
      <div>
        Path:
        <a href="#" @click="openFolder()">{{ this.$data.localPath }}</a>
      </div> -->

  </div>
</template>

<script>
import crypt from '../logic/crypt'
import path from 'path'
import temp from 'temp'
import fs, { existsSync } from 'fs'
import async from 'async'
import database from '../../database'
import Sync from '../logic/sync'
import Uploader from '../logic/uploader'
import Tree from '../logic/tree'
import Monitor from '../logic/monitor'
import Logger from '../../libs/logger'
import PackageJson from '../../../package.json'
import DeviceLock from '../logic/devicelock'
import SpaceUsage from '../logic/utils/spaceusage'
import analytics from '../logic/utils/analytics'
import ConfigStore from '../../../src/main/config-store'
import Header from '../components/Header/Header'
import FileStatus from '../components/FileStatus//FileStatus'
import SyncButtonAction from '../components/SyncButtonAction/SyncButtonAction'
import FileLogger from '../logic/FileLogger'

window.FileLogger = FileLogger

const remote = require('@electron/remote')

export default {
  name: 'xcloud-page',
  components: {
    Header,
    FileStatus,
    SyncButtonAction
  },

  data() {
    return {
      databaseUser: '',
      localPath: '',
      currentEnv: '',
      isSyncing: false,
      toolTip: '',
      appName: 'Drive',
      emailAccount: null,
      IconClass: 'prueba',
      file: {},
      flag: false,
      FileStatusSync: []
    }
  },

  beforeCreate() {
    remote.app.emit('window-hide')

    SpaceUsage.updateUsage()
      .then(() => {})
      .catch(() => {})
    database
      .Get('xUser')
      .then(xUser => {
        const userEmail = xUser.user.email
        this.emailAccount = userEmail
        Logger.info(
          'Account: %s, User platform: %s %s, version: %s',
          userEmail,
          process.platform,
          process.arch,
          PackageJson.version
        )
      })
      .catch(err => {
        console.log('Cannot update tray icon', err.message)
      })
  },
  beforeDestroy: function() {
    FileLogger.removeAllListeners('update-last-entry')
    FileLogger.removeAllListeners('new-entry')
    remote.app.removeAllListeners('user-logout')
    remote.app.removeAllListeners('new-folder-path')
    remote.app.removeListener('set-tooltip', this.setTooltip)
  },
  created: function() {
    FileLogger.on('update-last-entry', (entry) => {
      this.FileStatusSync[0] = entry
    })
    FileLogger.on('new-entry', (entry) => {
      if (this.FileStatusSync.length >= 50) {
        this.FileStatusSync.pop()
      }
      this.FileStatusSync.unshift(entry)
    })
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
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
    stopSync() {
      remote.app.emit('sync-stop')
    },
    unlockDevice() {
      DeviceLock.unlock()
    }, /*
    changeTrayIconOn() {
      remote.app.emit('sync-on')
    }, */
    changeTrayIconOff() {
      remote.app.emit('sync-off', false)
    },
    getUser() {},
    getUsage() {
      SpaceUsage.getLimit()
      SpaceUsage.getUsage()
    },
    getLocalFolderPath() {
      database
        .Get('xPath')
        .then(path => {
          this.$data.localPath = path
        })
        .catch(() => {
          this.$data.localPath = 'error'
        })
    },
    setTooltip(text) {
      this.toolTip = text
    },
    getCurrentEnv() {
      this.$data.currentEnv = process.env.NODE_ENV
    },
    // Clear data UI
    setUpdateFlag() {
      this.flag = true
      this.FileStatusSync = []
      console.log(this.flag)
    }
  }
}
</script>
