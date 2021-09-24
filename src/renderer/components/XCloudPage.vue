<template>
  <div class="flex flex-none flex-col h-full w-full overflow-x-hidden relative">
    <Header class="header z-20 bg-white" :appName="appName" :emailAccount="emailAccount" :userFullname="userFullname" :backupStatus="backupStatus"/>
    <BackupErrorBanner :backupStatus="backupStatus" @actionClick="openBackupsWindow"/>
    <ConnectionBanner/>
    <FileStatus :backupProgress="backupProgress" class="fileStatus bg-white fileLogger overflow-y-auto overflow-x-hidden flex flex-col flex-grow flex-shrink" :FileStatusSync="FileStatusSync" />
    <SyncButtonAction class="statusBar overflow-hidden flex flex-none justify-between py-2 px-3" :FileStatusSync="FileStatusSync"/>
    <BackupProgress v-if="backupProgress" style="transform: translateX(-50%)" class="absolute bottom-14 left-1/2 w-11/12" :progress="backupProgress"/>
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
import FileStatus from '../components/FileStatus/FileStatus'
import SyncButtonAction from '../components/SyncButtonAction/SyncButtonAction'
import BackupProgress from '../components/BackupProgress/BackupProgress.vue'
import BackupErrorBanner from './BackupErrorBanner/BackupErrorBanner.vue'
import BackupStatus from '../../backup-process/status'
import ConnectionBanner from './ConnectionBanner/ConnectionBanner.vue'
import FileLogger from '../logic/FileLogger'
import Auth from '../logic/utils/Auth'
import Vue from 'vue'
import {ipcRenderer} from 'electron'

const remote = require('@electron/remote')

export default {
  name: 'xcloud-page',
  components: {
    Header,
    FileStatus,
    SyncButtonAction,
    BackupProgress,
    BackupErrorBanner,
    ConnectionBanner
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
      FileStatusSync: [],
      userFullname: '',
      backupProgress: null,
      backupStatus: ''
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
        this.userFullname = xUser.user.name + ' ' + xUser.user.lastname
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
  mounted: function () {
    Auth.denormalizeAuthInfoInConfigStore()
    FileLogger.loadLog()
    ipcRenderer.invoke('get-backup-status')
      .then(this.setBackupStatus)
    remote.app.on('backup-status-update', this.setBackupStatus)
    remote.app.on('backup-progress', this.setBackupProgress)
  },
  beforeDestroy: function () {
    FileLogger.removeAllListeners('update-last-entry')
    FileLogger.removeAllListeners('new-entry')
    FileLogger.removeAllListeners('clear-log')
    remote.app.removeAllListeners('user-logout')
    remote.app.removeListener('set-tooltip', this.setTooltip)
    remote.app.removeAllListeners('update-last-entry')
    remote.app.removeAllListeners('filelogger-push')
    remote.app.removeListener('backup-status-update', this.setBackupStatus)
    remote.app.removeListener('backup-progress', this.setBackupProgress)
    FileLogger.saveLog()
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
      if (this.FileStatusSync.length >= 100) {
        this.FileStatusSync.pop()
      }
      this.FileStatusSync.unshift(entry)
      this.$forceUpdate()
    })
    FileLogger.on('delete-entry', (index) => {
      this.FileStatusSync.splice((this.FileStatusSync.length - index), 1)
      this.$forceUpdate()
    })
    remote.app.on('filelogger-push', payload => FileLogger.push(payload))
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
    },
    setBackupStatus(value) {
      this.backupStatus = value
    },
    setBackupProgress(value) {
      this.backupProgress = value
    },
    openBackupsWindow() {
      ipcRenderer.send('open-settings-window', 'backups', 'list')
    }
  },
  watch: {
    backupStatus(_, oldVal) {
      if (oldVal === BackupStatus.IN_PROGRESS) {
        this.backupProgress = null
      }
    }
  }
}
</script>
