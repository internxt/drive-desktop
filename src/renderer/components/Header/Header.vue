<template>
  <div>
    <div
      class="flex justify-between self-center p-3"
      style="-webkit-app-region: drag"
    >
      <div class="flex flex-col" style="-webkit-app-region: no-drag">
        <div class="flex items-center">
          <Avatar size="40" :userFullname="userFullname"/>
          <div class="text-sm ml-3">
            <div>{{ emailAccount }}</div>
            <div class="flex" v-if="showUsage">
              <div class="mr-0.5 text-gray-500">{{ usage }} of {{ limit }}</div>
              <div
                v-if="this.showUpgrade"
                class="ml-1 text-blue-60 cursor-pointer"
                @click="openLinkBilling()"
              >
                Upgrade
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center space-x-3">
        <!-- {{ this.$data.localPath }} -->

        <backup-icon
          @click="() =>openSettingsWindow('backups')" :state="backupStatus"/>

        <div
          class="flex items-center justify-center cursor-pointer"
          @click="openFolder()"
          v-tooltip="{
            content: 'Open sync folder',
            placement: 'bottom',
            delay: { show: 1500, hide: 50 },
          }"
        >
          <UilFolderOpen class="text-gray-500" size="22px" />
        </div>

        <div
          class="
            flex
            items-center
            justify-center
            cursor-pointer
            dropdown
          "
          v-tooltip="{
            content: 'Settings',
            placement: 'bottom',
            delay: { show: 1500, hide: 50 },
          }"
        >
          <UilSetting
            class="text-gray-500 dropdown-toggle"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
            size="22px"
          />

          <div class="dropdown-menu">
            <a class="text-gray-700 dropdown-item" @click="() =>openSettingsWindow('general')"
              >Preferences</a
            >
            <a class="text-gray-700 dropdown-item" @click="ContactSupportMailto"
              >Support</a
            >
            <a class="text-gray-700 dropdown-item">Send feedback</a>
            <a class="text-gray-700 dropdown-item">Error log</a>
            <a class="text-gray-700 dropdown-item" @click="quitApp">Quit</a>
          </div>
        </div>
      </div>
    </div>

    <!-- SYNC MODAL -->
    <div v-if="showModal === 'sync'" class="headerModal">
      <div class="title">Selective Sync</div>
      <div class="subtitle">
        Hide folders you don't want to sync with this device
      </div>

      <div
        class="
          flex
          py-24
          mt-4
          w-full
          items-center
          justify-center
          bg-gray-100
          rounded-lg
        "
      >
        <div class="subtitle">Coming soon</div>
      </div>
    </div>

    <div
      v-if="showSyncSettingsModal && selectedSyncOption === false"
      class="
        absolute
        top-0
        left-0
        z-20
        bg-blue-600 bg-opacity-90
        h-full
        w-full
        flex flex-col
        justify-center
        items-center
        text-white
      "
    >
      <h1 class="text-lg text-white font-bold">Attention</h1>
      <p class="text-base text-center w-72 mt-3">
        By changing to full sync you will start synchronizing all your content.
        The next sync will be Upload only to ensure your files.
      </p>

      <div class="mt-4">
        <button
          @click="CloseSyncSettingsModal()"
          class="text-sm mr-5 cursor-pointer focus:outline-none"
        >
          Cancel
        </button>
        <button
          @click="syncModeChange()"
          class="
            w-24
            py-2
            rounded-full
            bg-white
            font-semibold
            text-sm text-blue-600
            cursor-pointer
            focus:outline-none
          "
        >
          Accept
        </button>
      </div>
    </div>

    <div
      v-if="showSyncSettingsModal && selectedSyncOption === true"
      class="
        absolute
        top-0
        left-0
        z-20
        bg-blue-600 bg-opacity-90
        h-full
        w-full
        flex flex-col
        justify-center
        items-center
        text-white
      "
    >
      <h1 class="text-lg text-white font-bold">Attention</h1>
      <p class="text-base text-center w-72 mt-3">
        By changing to upload only mode you will be able to delete files locally
        whithout losing them from your cloud. This option is perfect for
        backups.
      </p>

      <div class="mt-4">
        <button
          @click="CloseSyncSettingsModal()"
          class="text-sm mr-5 cursor-pointer focus:outline-none"
        >
          Cancel
        </button>
        <button
          @click="syncModeChange()"
          value="full"
          class="
            w-24
            py-2
            rounded-full
            bg-white
            font-semibold
            text-sm text-blue-600
            cursor-pointer
            focus:outline-none
          "
        >
          Accept
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import './Header.scss'
import {
  UilFolderNetwork,
  UilSetting,
  UilUserCircle,
  UilMultiply,
  UilFolderOpen,
  UilServerConnection,
  UilFileTimes,
  UilSlidersVAlt,
  UilHistory
} from '@iconscout/vue-unicons'
import 'ant-design-vue/dist/antd.css'
import InternxtBrand from '../ExportIcons/InternxtBrand'
import database from '../../../database/index'
import FileLogger from '../../logic/FileLogger'
import Monitor from '../../logic/monitor'
import ConfigStore from '../../../main/config-store'
import analytics from '../../logic/utils/analytics'
import Logger from '../../../libs/logger'
import VToolTip from 'v-tooltip'
import bytes from 'bytes'
import FileIcon from '../Icons/FileIcon.vue'
import Checkbox from '../Icons/Checkbox.vue'
import Avatar from '../Avatar/Avatar.vue'
import BackupIcon from '../Icons/BackupIcon.vue'
import { ipcRenderer } from 'electron'
import BackupsDB from '../../../backup-process/backups-db'

Vue.use(VToolTip)
const remote = require('@electron/remote')

// Close all modals when pressing 'Escape'

export default {
  data() {
    return {
      placement: 'left',
      isProduction: process.env.NODE_ENV === 'production',
      showModal: '',
      localPath: '',
      selectedSyncOption: 'none',
      path: null,
      msg: 'Mensaje de texto',
      usage: '',
      limit: '',
      CheckedValue: ConfigStore.get('uploadOnly'),
      showSyncSettingsModal: false,
      console: console,
      showUpgrade: false,
      showUsage: false,
      backupStatus: null
    }
  },
  beforeCreate: function() {
    database.Get('xPath').then(path => {
      this.$data.path = path
    })
  },
  mounted() {
    ipcRenderer.invoke('is-backup-running')
      .then(this.onBackupRunningUpdate)
    remote.app.on('backup-running-update', this.onBackupRunningUpdate)
  },
  beforeDestroy: function() {
    remote.app.removeAllListeners('user-logout')
    remote.app.removeAllListeners('update-storage')
    remote.app.removeAllListeners('update-last-entry')
    remote.app.removeAllListeners('new-folder-path')
    remote.app.removeListener('backup-running-update', this.onBackupRunningUpdate)
  },
  created: function() {
    this.$app = this.$electron.remote.app
    // Storage and space used
    remote.app.on('update-storage', data => {
      this.usage = data.usage
      this.limit = data.limit
      if (this.usage && this.limit) {
        this.showUpgrade = bytes.parse(this.limit) < 2199023255552
        this.showUsage = true
      }
    })
    FileLogger.on('update-last-entry', item => {
      this.file = item
    })
    Monitor.Monitor(true)
    remote.app.on('user-logout', async (saveData = false) => {
      remote.app.emit('sync-stop')
      await database.logOut(saveData)
      analytics
        .track({
          event: 'user-signout',
          userId: undefined,
          properties: {
            email: 'email'
          }
        })
        .then(() => {
          analytics.resetUser()
        })
        .catch(err => {
          Logger.error(err)
        })
      this.$router.push('/').catch(() => {})
    })

    remote.app.on('new-folder-path', async newPath => {
      remote.app.emit('sync-stop')
      await database.ClearAll()
      await database.Set('lastSyncSuccess', false)
      database.Set('xPath', newPath)
      remote.app.emit('window-pushed-to', '/xcloud')
      this.$router.push('/xcloud').catch(() => {})
    })
  },
  updated: function() {},
  methods: {
    debug() {},
    openLinkBilling() {
      remote.shell.openExternal('https://drive.internxt.com/storage')
    },
    // Log out - save folder path whe user log out
    stopSync() {
      remote.app.emit('sync-stop')
    },
    toggleModal(mdl) {
      (mdl === ('' || undefined)) ? this.showModal = '' : ((mdl === this.showModal) ? this.showModal = '' : this.showModal = mdl)
    },
    closeModal(mdl) {
      this.showModal = mdl
    },
    // Close Modal Settings
    OpenSyncSettingsModal(syncOption) {
      if (this.CheckedValue !== syncOption) {
        this.selectedSyncOption = syncOption
        this.showSyncSettingsModal = true
      }
    },
    CloseSyncSettingsModal() {
      this.showSyncSettingsModal = false
    },
    // Open folder path
    openFolder() {
      remote.app.emit('open-folder')
    },
    // Launch folder path
    getLocalFolderPath() {
      database
        .Get('xPath')
        .then(path => {
          this.$data.localPath = path
        })
        .catch(err => {
          console.error(err)
          this.$data.localPath = 'error'
        })
    },
    // Full sync - Upload only Sync mode
    syncModeChange() {
      if (this.selectedSyncOption === false) {
        remote.app.emit('update-configStore', { forceUpload: 2 })
        remote.app.emit('update-configStore', { uploadOnly: false })
        this.CheckedValue = false
      } else {
        remote.app.emit('update-configStore', { uploadOnly: true })
        this.CheckedValue = true
      }
      this.showSyncSettingsModal = false
      this.stopSync()
    },
    openSettingsWindow(section = 'general') {
      ipcRenderer.send('open-settings-window', section)
    },
    // Contact support
    ContactSupportMailto() {
      if (process.platform === 'linux') {
        remote.app.emit('show-info', 'email: hello@internxt.com')
      } else {
        remote.shell.openExternal(
          `mailto:hello@internxt.com?subject=Support Ticket&body=If you want to upload log files to our tech teams. Please, find them on the Open Logs option in the menu.`
        )
      }
    },
    quitApp() {
      remote.app.emit('app-close')
    },
    async onBackupRunningUpdate(value) {
      const errors = await BackupsDB.getErrors()
      if (errors.length) {
        this.backupStatus = 'warn'
      } else if (value) {
        this.backupStatus = 'in-progress'
      } else if (this.backupStatus === 'in-progress') { this.backupStatus = 'success' }
    }
  },
  name: 'Header',
  props: {
    appName: {
      type: String,
      default: 'Internxt'
    },
    emailAccount: {
      type: String,
      default: 'Aplication'
    },
    IconClass: {
      type: String,
      default: ''
    },
    userFullname: {
      type: String,
      default: ''
    }
  },
  components: {
    UilSetting,
    UilUserCircle,
    UilFolderNetwork,
    InternxtBrand,
    UilMultiply,
    UilHistory,
    UilFolderOpen,
    UilServerConnection,
    UilFileTimes,
    UilSlidersVAlt,
    FileIcon,
    Checkbox,
    Avatar,
    BackupIcon
  }
}
</script>
