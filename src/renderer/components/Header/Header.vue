<template>
  <div>
    <div class="flex justify-between self-center p-3">
      <div class="flex flex-col">
        <div class="flex items-center">
          <div class="text-sm">
            <div>{{ emailAccount }}</div>
            <div class="flex" v-if="showUsage">
              <div class="mr-0.5 text-gray-500"> <span :class="{'text-red-600': showUsageWarning }">{{ usage }}</span> of {{ limit }}</div>
              <div
                v-if="this.showUpgrade"
                class="ml-1 text-blue-60 cursor-pointer"
                @click="openLinkBilling()"
              >
                Upgrade
              </div>
            </div>
            <content-placeholders v-else class="h-5 pt-1" :rounded="true" style="margin-bottom: -4px;" >
              <content-placeholders-text :lines="1" />
            </content-placeholders>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center space-x-3">
        <!-- {{ this.$data.localPath }} -->

        <backup-icon
          @click="() => openSettingsWindow('backups')"
          class="text-gray-500"
          :state="backupStatus"
          size="22"
        />

        <div
          class="flex items-center justify-center cursor-pointer"
          @click="openFolder()"
          v-tooltip="{
            content: 'Open sync folder',
            placement: 'bottom',
            delay: { show: 750, hide: 50 }
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
            dropdown"
        >
          <UilSetting
            class="text-gray-500 dropdown-toggle"
            style="outline: none"
            data-toggle="dropdown"
            data-offset="10,10"
            aria-haspopup="true"
            aria-expanded="false"
            size="22px"
            v-tooltip="{
              content: 'Settings',
              placement: 'bottom',
              delay: { show: 750, hide: 50 }
            }"
          />

          <div class="dropdown-menu rounded-lg">
            <a
              class="text-gray-700 dropdown-item"
              @click="() => openSettingsWindow('general')"
              >Preferences</a
            >
            <a class="text-gray-700 dropdown-item" @click="ContactSupportMailto"
              >Support</a
            >
            <a class="text-gray-700 dropdown-item" @click="logout">Log out</a>
            <a v-if="!isProduction" class="text-gray-700 dropdown-item" @click="unlockDevice">Unlock</a>
            <a class="text-gray-700 dropdown-item border-gray-100 border-t border-solid pt-2" @click="quitApp">Quit</a>
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
    <div v-if="showUsageWarning" class="px-3 py-2 flex items-center text-xs border-yellow-100 border-b bg-yellow-50 text-yellow-600">
      <img style="width: 20px; height:20px" src="../../assets/icons/apple/warn.svg"/>
      <p class="ml-2">Running out of space</p>
      <p @click="openLinkBilling" class="flex-grow underline cursor-pointer flex justify-end items-center">Upgrade now</p>
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
import DeviceLock from '../../logic/devicelock'

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
      showUsage: false
    }
  },
  beforeCreate: function() {
    database.Get('xPath').then(path => {
      this.$data.path = path
    })
  },
  beforeDestroy: function() {
    remote.app.removeAllListeners('user-logout')
    remote.app.removeAllListeners('update-storage')
    remote.app.removeAllListeners('update-last-entry')
    remote.app.removeAllListeners('new-folder-path')
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
    unlockDevice() {
      DeviceLock.unlock()
      remote.app.emit('ui-sync-status', 'unblock')
    },
    logout() {
      this.$store.originalDispatch('showSettingsDialog', {
        title: 'Log out',
        description: 'Would you like to remember where your sync folder is the next time you log in?',
        checkbox: 'Remember sync folder path',
        answers: [{text: 'Cancel'}, {text: 'Log out', state: 'accent'}],
        callback: (userResponse, checkbox) => {
          if (userResponse === 1) {
            ipcRenderer.send('stop-backup-process')
            remote.app.emit('user-logout', checkbox)
          }
        }
      })
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
    },
    backupStatus: {
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
  },
  computed: {
    showUsageWarning() {
      if (this.usage === '' || this.limit === '') {
        return false
      }

      const usageInBytes = bytes.parse(this.usage)
      const limitInBytes = bytes.parse(this.limit)

      return usageInBytes / limitInBytes >= 0.9
    }
  }
}
</script>
