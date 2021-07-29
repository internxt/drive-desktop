<template>
  <div class="flex flex-none flex-col h-full w-full overflow-x-hidden">
    <Header class="overflow-hidden" :appName="appName" :emailAccount="emailAccount"/>
    <FileStatus class="bg-white fileLogger overflow-y-auto overflow-x-hidden flex flex-col flex-grow flex-shrink py-2" :FileStatusSync="FileStatusSync" />
    <SyncButtonAction class="flex flex-none justify-between p-4 px-6" :FileStatusSync="FileStatusSync"/>
  </div>
</template>

<script>
import database from '../../database'
import Monitor from '../logic/monitor'
import Logger from '../../libs/logger'
import PackageJson from '../../../package.json'
import DeviceLock from '../logic/devicelock'
import SpaceUsage from '../logic/utils/spaceusage'
import ConfigStore from '../../../src/main/config-store'
import Header from '../components/Header/Header'
import FileStatus from '../components/FileStatus//FileStatus'
import SyncButtonAction from '../components/SyncButtonAction/SyncButtonAction'
import FileLogger from '../logic/FileLogger'
import Vue from 'vue'

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
      isSyncing: ConfigStore.get('isSyncing'),
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
    remote.app.emit('window-show')

    SpaceUsage.updateUsage()
      .then(() => {})
      .catch(() => {})
    database
      .Get('xUser')
      .then((xUser) => {
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
      .catch((err) => {
        console.log('Cannot update tray icon', err.message)
      })
  },
  beforeDestroy: function () {
    FileLogger.removeAllListeners('update-last-entry')
    FileLogger.removeAllListeners('new-entry')
    FileLogger.removeAllListeners('clear-log')
    remote.app.removeAllListeners('user-logout')
    remote.app.removeAllListeners('new-folder-path')
    remote.app.removeListener('set-tooltip', this.setTooltip)
    remote.app.removeAllListeners('update-last-entry')
  },
  created: function () {
    FileLogger.on('clear-log', () => {
      this.FileStatusSync = []
    })
    FileLogger.on('update-last-entry', (entry) => {
      Vue.set(this.FileStatusSync, 0, entry)
      // this.$forceUpdate()
    })
    FileLogger.on('new-entry', (entry) => {
      if (this.FileStatusSync.length >= 50) {
        this.FileStatusSync.pop()
      }
      this.FileStatusSync.unshift(entry)
      this.$forceUpdate()
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
      remote.app('ui-sync-status', 'unblock')
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
        .then((path) => {
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
    }
  }
}
</script>
