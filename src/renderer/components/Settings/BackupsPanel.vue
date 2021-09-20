<template>
  <backups-list @close="showList = false" v-if="showList" :backupsBucket="backupsBucket" :errors="errors" />
  <div v-else>
    <p class="p-3 rounded-xl bg-yellow-100 text-yellow-700 mb-3 text-xs" v-if="errors.length"><UilExclamationTriangle class="mr-2 inline text-yellow-700" size="20px"/>{{errors.length}} folder(s) in your backup failed. <u class="font-semibold cursor-pointer" @click="startBackupProcess">Retry now</u> or <u class="font-semibold cursor-pointer" @click="showList = true">check what failed</u></p>
    <Checkbox
      :forceStatus="backupsEnabled ? 'checked' : 'unchecked'"
      @click.native="backupsEnabled = !backupsEnabled"
      label="Back up your folder and files"
    />
    <Button class="mt-2" @click="showList = true"
      >Select folders to backup</Button
    >
    <div class="flex items-center mt-3">
      <Button v-if="!isCurrentlyBackingUp" :state="backupsEnabled ? 'accent' : 'accent-disabled'" @click="startBackupProcess">Backup now</Button>
      <Button v-else state="red" @click="stopBackupProcess">Stop backup</Button>

      <p class="text-xs text-gray-500 ml-3">{{backupStatus }}</p>
    </div>
    <p class="mt-3 text-xs text-gray-500">Upload frequency</p>
    <div class="dropdown mt-2">
      <button
        class="bg-white border border-gray-400 rounded-md text-sm"
        style="padding-left: 10px"
        type="button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {{ humanifyInterval(currentInterval) }}
        <UilAngleDown
          class="inline bg-blue-600 text-white rounded-tr-md rounded-br-md"
          style="margin-left: 5px"
          size="25px"
        />
      </button>
      <div class="dropdown-menu">
        <a
          v-for="interval in intervalOptions"
          class="dropdown-item text-sm"
          :key="interval"
          @click="currentInterval = interval"
          >{{ humanifyInterval(interval) }}</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import Checkbox from '../Icons/Checkbox.vue'
import Button from '../Button/Button.vue'
import {
  UilAngleDown,
  UilExclamationTriangle
} from '@iconscout/vue-unicons'
import {updateBackupsOfDevice, getDeviceByMac} from '../../../backup-process/service'
import ConfigStore from '../../../main/config-store'
import BackupsList from './BackupsList.vue'
import { ipcRenderer } from 'electron'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import BackupsDB from '../../../backup-process/backups-db'
import path from 'path'

const remote = require('@electron/remote')
const {app} = remote

export default {
  components: {
    Checkbox,
    Button,
    UilAngleDown,
    BackupsList,
    UilExclamationTriangle
  },
  props: ['backupsBucket'],
  data() {
    return {
      intervalOptions: [
        6 * 3600 * 1000,
        12 * 3600 * 1000,
        24 * 3600 * 1000
      ],
      currentInterval: ConfigStore.get('backupInterval'),
      backupsEnabled: ConfigStore.get('backupsEnabled'),
      showList: false,
      isCurrentlyBackingUp: false,
      errors: [],
      backupProgress: null
    }
  },
  mounted() {
    ipcRenderer.invoke('is-backup-running')
      .then(this.setCurrentlyBackingUp)
    app.on('backup-running-update', this.setCurrentlyBackingUp)
    app.on('backup-progress', this.setBackupProgress)
  },
  beforeDestroy() {
    app.removeListener('backup-running-update', this.setCurrentlyBackingUp)
    app.removeListener('backup-progress', this.setBackupProgress)
  },
  methods: {
    humanifyInterval(interval) {
      switch (interval) {
        case 6 * 3600 * 1000:
          return 'Every 6 hours'
        case 12 * 3600 * 1000:
          return 'Every 12 hours'
        case 24 * 3600 * 1000:
          return 'Every day'
        default:
          return null
      }
    },
    async getAllErrors() {
      this.errors = await BackupsDB.getErrors()
    },
    startBackupProcess() {
      ipcRenderer.send('start-backup-process')
    },
    async stopBackupProcess() {
      const {response} = await remote.dialog.showMessageBox(remote.getCurrentWindow(),
        { type: 'question', buttons: ['Confirm', 'Cancel'], defaultId: 1, cancelId: 1, title: 'Confirm backup stop', message: 'Are you sure that you want to stop the ongoing backup process?' })

      if (response === 0) { ipcRenderer.send('stop-backup-process') }
    },
    setCurrentlyBackingUp(value) {
      this.isCurrentlyBackingUp = value
      this.getAllErrors()
    },
    setBackupProgress(value) {
      this.backupProgress = value
    }
  },
  watch: {
    backupsEnabled(val) {
      ConfigStore.set('backupsEnabled', val)
    },
    async currentInterval(val) {
      ConfigStore.set('backupInterval', val)

      const device = await getDeviceByMac()
      updateBackupsOfDevice(device.id, {interval: val})
    },
    isCurrentlyBackingUp(value) {
      if (!value) { this.backupProgress = null }
    }
  },
  computed: {
    backupStatus() {
      if (this.isCurrentlyBackingUp) {
        if (!this.backupProgress) { return 'Backup in progress...' } else {
          const {currentBackup, currentBackupProgress, currentBackupIndex, totalBackupsCount} = this.backupProgress
          const currentBackupName = path.basename(currentBackup.path)
          return `${currentBackupIndex + 1} of ${totalBackupsCount} folders - Backing up ${currentBackupName} (${currentBackupProgress}%)`
        }
      }

      const lastBackupTimestamp = ConfigStore.get('lastBackup')
      if (lastBackupTimestamp !== -1) {
        dayjs.extend(relativeTime)
        const lastBackupFormatted = dayjs().to(dayjs(lastBackupTimestamp))
        return `Updated ${lastBackupFormatted}`
      } else { return '' }
    }
  }

}
</script>