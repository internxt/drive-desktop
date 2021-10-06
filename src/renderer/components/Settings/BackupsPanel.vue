<template>
  <backups-list @close="showList = false" v-if="showList" :backupsBucket="backupsBucket" :errors="errors" />
  <div v-else>
    <div class="flex items-center space-x-3">
      <Checkbox
        :forceStatus="backupsEnabled ? 'checked' : 'unchecked'"
        @click.native="backupsEnabled = !backupsEnabled"
        label="Back up your folder and files"
      />
      <p class="text-blue-500 underline cursor-pointer text-xs" @click="openDriveWeb">View your backups</p>
    </div>
    <div class="flex items-baseline">
    <Button class="mt-2" @click="showList = true"
      >Select folders to backup</Button
    >
    <p class="ml-2 text-xs" :class="{'text-red-600': backupStatus === 'FATAL', 'text-yellow-500': backupStatus === 'WARN', 'hidden': !['WARN', 'FATAL'].includes(backupStatus)}" >Could not upload some folders</p>
</div>
    <div class="flex items-center mt-3">
      <Button v-if="backupStatus !== 'IN_PROGRESS'" :state="backupsEnabled ? 'accent' : 'accent-disabled'" @click="startBackupProcess">Backup now</Button>
      <Button v-else state="red" @click="stopBackupProcess">Stop backup</Button>

      <p class="text-xs text-gray-500 ml-3">{{backupMessage }}</p>
    </div>
    <p class="mt-3 text-xs text-gray-500">Upload frequency</p>
    <div class="dropdown mt-2">
      <button
        class="bg-white border border-gray-400 rounded-md text-sm"
        :class="{'text-gray-400 cursor-default': !backupsEnabled}"
        style="padding-left: 10px"
        type="button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
        :disabled="!backupsEnabled"
      >
        {{ humanifyInterval(currentInterval) }}
        <UilAngleDown
          class="inline rounded-tr-md rounded-br-md"
          :class="{'bg-blue-300 text-blue-100': !backupsEnabled, 'bg-blue-600 text-white': backupsEnabled}"
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
import BackupStatus from '../../../backup-process/status'
import analytics from '../../logic/utils/analytics'

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
  props: ['backupsBucket', 'backupStatus'],
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
  async mounted() {
    const queryParams = new URLSearchParams(location.href.split('?')[1])
    const subsection = queryParams.get('subsection')

    if (subsection === 'list') {
      this.showList = true
    }

    app.on('backup-progress', this.setBackupProgress)
    this.errors = await BackupsDB.getErrors()
  },
  beforeDestroy() {
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
      this.$store.originalDispatch('showSettingsDialog', {
        title: 'Stop ongoing backup',
        description: 'Are you sure that you want to stop the ongoing backup process?',
        answers: [
          {text: 'Cancel'},
          {text: 'Stop backup', state: 'red'}
        ],
        callback: (response) => {
          if (response === 1) { ipcRenderer.send('stop-backup-process') }
        }
      })
    },
    setBackupProgress(value) {
      this.backupProgress = value
    },
    openDriveWeb() {
      analytics.trackLinkToDriveBackups()
      remote.shell.openExternal('https://drive.internxt.com/app/backups')
    }
  },
  watch: {
    backupsEnabled(val) {
      ConfigStore.set('backupsEnabled', val)
      analytics.trackBackupsEnabled()
    },
    async currentInterval(val) {
      ConfigStore.set('backupInterval', val)
      analytics.trackBackupInterval()

      const device = await getDeviceByMac()
      updateBackupsOfDevice(device.id, {interval: val})
    },
    async backupStatus(_, oldValue) {
      if (oldValue === BackupStatus.IN_PROGRESS) {
        this.backupProgress = null
      }
      this.errors = await BackupsDB.getErrors()
    }
  },
  computed: {
    backupMessage() {
      if (this.backupStatus === BackupStatus.IN_PROGRESS) {
        if (!this.backupProgress) { return 'Backup in progress...' } else {
          const {currentBackup, currentBackupProgress, currentBackupIndex, totalBackupsCount} = this.backupProgress
          const currentBackupName = path.basename(currentBackup.path)
          return `${currentBackupIndex + 1} of ${totalBackupsCount} folders - Backing up ${currentBackupName} ${currentBackupProgress !== null ? `(${currentBackupProgress}%)` : ''}`
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