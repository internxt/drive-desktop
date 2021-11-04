<template>
  <div class="flex flex-none flex-col h-full w-full overflow-x-hidden relative">
    <Header class="header z-20 bg-white" :appName="appName" :emailAccount="emailAccount" :userFullname="userFullname" :backupStatus="backupStatus"/>
    <BackupErrorBanner :backupStatus="backupStatus" @actionClick="openBackupsWindow"/>
    <ConnectionBanner/>
    <BackupProgress v-if="backupProgress" style="transform: translateX(-50%)" class="absolute bottom-14 left-1/2 w-11/12" :progress="backupProgress"/>
    <Dialog v-if="$store.state.ui.settingsDialog"/>
  </div>
</template>

<script>
import SpaceUsage from '../logic/utils/spaceusage'
import Header from '../components/Header/Header'
import Dialog from '../components/Settings/Dialog.vue'
import BackupProgress from '../components/BackupProgress/BackupProgress.vue'
import BackupErrorBanner from './BackupErrorBanner/BackupErrorBanner.vue'
import BackupStatus from '../../backup-process/status'
import ConnectionBanner from './ConnectionBanner/ConnectionBanner.vue'
import * as Auth from '../../main/auth'
import {ipcRenderer} from 'electron'

const remote = require('@electron/remote')

export default {
  name: 'xcloud-page',
  components: {
    Header,
    BackupProgress,
    BackupErrorBanner,
    ConnectionBanner,
    Dialog
  },

  data() {
    return {
      appName: 'Drive',
      emailAccount: null,
      userFullname: '',
      backupProgress: null,
      backupStatus: ''
    }
  },

  beforeCreate() {
    remote.app.emit('window-show')

    SpaceUsage.updateUsage()
  },
  mounted() {
    ipcRenderer.invoke('get-backup-status')
      .then(this.setBackupStatus)
    remote.app.on('backup-status-update', this.setBackupStatus)
    remote.app.on('backup-progress', this.setBackupProgress)
    const user = Auth.getUser()

    this.userFullname = `${user.name} ${user.lastname}`
    this.emailAccount = user.email
  },
  beforeDestroy() {
    remote.app.removeListener('backup-status-update', this.setBackupStatus)
    remote.app.removeListener('backup-progress', this.setBackupProgress)
  },
  created() {
    this.$app = this.$electron.remote.app
  },
  methods: {
    getUsage() {
      SpaceUsage.getLimit()
      SpaceUsage.getUsage()
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
