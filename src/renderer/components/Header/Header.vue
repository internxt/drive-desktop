<template>
  <div>
    <div class="flex justify-between self-center p-3 pl-4 pr-4" style="-webkit-app-region: drag">
      <div class="flex flex-col" style="-webkit-app-region: no-drag;">
        <div class="flex items-center">
          <img class="mr-3" src="../../assets/svg/brand-app.svg" width="40px" height="40px" style="min-width:40px;"/>
          <div class="text-sm">
            <div>{{ emailAccount }}</div>
            <div class="flex" v-if="showUsage">
              <div class="mr-0.5">{{ usage }} of {{ limit }}</div>
              <div v-if="this.showUpgrade" class="ml-1 text-blue-60 cursor-pointer" @click="openLinkBilling()">Upgrade</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center">
        <!-- {{ this.$data.localPath }} -->

        <div
          class="flex items-center justify-center cursor-pointer menuItem"
          :class="{ 'selectedModal' : showModal === 'sync'}"
          v-on:click="toggleModal('sync')"
          v-tooltip="{
            content: 'Selective sync',
            placement: 'bottom',
            delay: { show: 1000, hide: 50 }
          }"
        >
          <UilSync class="text-blue-60" size="22px" />
        </div>

        <div
          class="flex items-center justify-center cursor-pointer menuItem"
          @click="openFolder()"
          v-tooltip="{
            content: 'Open sync folder',
            placement: 'bottom',
            delay: { show: 1000, hide: 50 }
          }"
        >
          <UilFolderOpen class="text-blue-60" size="22px" />
        </div>

        <div
          class="flex items-center justify-center cursor-pointer menuItem"
          :class="{ 'selectedModal' : showModal === 'settings'}"
          @click="toggleModal('settings')"
          v-tooltip="{
            content: 'Settings',
            placement: 'bottom',
            delay: { show: 1000, hide: 50 }
          }"
        >
          <UilSetting class="text-blue-60" size="22px" />
        </div>

      </div>
    </div>

    <!-- SETTINGS MODAL -->
      <div
        v-if="showModal === 'settings'"
        class="headerModal"
      >
        <!-- DEV TOOLS -->
        <div v-if="!isProduction" class="subgroup note dev">
          <div class="title">Developer Tools</div>
          <div class="cursor-pointer" @click="UnlockDevice()">Unlock device</div>
        </div>

        <!-- USER SETTINGS -->
        <div class="title">Sync folder location</div>
        <div class="flex flex-col subgroup">
          <div class="flex flex-row items-center justify-between flex-grow">
            <div class="flex items-center" @dblclick="openFolder()">
              <FileIcon icon="folder" class="mr-2" width="20" height="20"/>
              <span>{{this.path}}</span>
            </div>
            <div v-on:click="changeFolder()" class="text-blue-60 cursor-pointer">Change</div>
          </div>
          <div v-on:click="toggleModal('sync')" class="text-blue-60 cursor-pointer mt-1">Selective sync</div>
        </div>
        

        <!--
        <span class="text-sm">Sync mode</span>
        <form class="mt-2 mb-2">

          <div @click="OpenSyncSettingsModal(false)" class="radioContainer ml-2">
            <p class="text-xs text-gray-500 hover:text-blue-500 cursor-pointer">
              Full sync
            </p>
            <input type="radio" name="radio" :checked="!CheckedValue" />
            <span class="checkmark"></span>
            <span class="smallCheckmark"></span>
          </div>

          <div @click="OpenSyncSettingsModal(true)" class="radioContainer mt-1 ml-2">
            <p class="text-xs text-gray-500 hover:text-blue-500 cursor-pointer pt-0.5">
              Upload only
            </p>
            <input type="radio" name="radio" :checked="CheckedValue" />
            <span class="checkmark mt-0.5"></span>
            <span class="smallCheckmark mt-0.5"></span>
          </div>

        </form>
        -->

        <div class="title">Launch at login</div>
        <label class="flex items-center checkbox subgroup">
          <input
            type="checkbox"
            :checked="LaunchCheck"
            @change="launchAtLogin()"
          />
          <span class="ml-2">Launch minimized</span>
        </label>

        <div class="title">Account</div>
        <div class="subgroup flex-col justify-start">
          <div class="cursor-pointer" @click="openLinkBilling()">Billing</div>
          <div class="cursor-pointer mt-1" @click="openLogs()">Open logs</div>
          <div class="cursor-pointer mt-1" @click="ContactSupportMailto()">Contact support</div>
          <div class="cursor-pointer mt-1 text-blue-60" @click="logout()">Log out</div>
          <div class="cursor-pointer mt-1 text-red-60" @click="quitApp()">Quit app</div>
        </div>

      </div>

    <!-- SYNC MODAL -->
    <div
      v-if="showModal === 'sync'"
      class="headerModal"
    >
      <div class="title">Selective Sync</div>
      <div class="subtitle">Hide folders you don't want to sync with this device</div>
    </div>

    <div
      v-if="showSyncSettingsModal && selectedSyncOption === false"
      class="absolute top-0 left-0 z-20 bg-blue-600 bg-opacity-90 h-full w-full flex flex-col justify-center items-center text-white"
    >
      <h1 class="text-lg text-white font-bold">Attention</h1>
      <p class="text-base text-center w-72 mt-3">
        By changing to full sync you will start synchronizing all your content. The next sync will be Upload only to ensure your files.
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
          class="w-24 py-2 rounded-full bg-white font-semibold text-sm text-blue-600 cursor-pointer focus:outline-none"
        >
          Accept
        </button>
      </div>
    </div>

    <div
      v-if="showSyncSettingsModal && selectedSyncOption === true"
      class="absolute top-0 left-0 z-20 bg-blue-600 bg-opacity-90 h-full w-full flex flex-col justify-center items-center text-white"
    >
      <h1 class="text-lg text-white font-bold">Attention</h1>
      <p class="text-base text-center w-72 mt-3">
        By changing to upload only mode you will be able to delete files locally whithout losing them from your cloud. This option is perfect for backups.
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
          class="w-24 py-2 rounded-full bg-white font-semibold text-sm text-blue-600 cursor-pointer focus:outline-none"
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
import fs from 'fs-extra'
import {
  UilFolderNetwork,
  UilSetting,
  UilSync,
  UilUserCircle,
  UilMultiply,
  UilFolderOpen,
  UilServerConnection,
  UilFileTimes,
  UilSlidersVAlt
} from '@iconscout/vue-unicons'
import 'ant-design-vue/dist/antd.css'
import InternxtBrand from '../ExportIcons/InternxtBrand'
import database from '../../../database/index'
import FileLogger from '../../logic/FileLogger'
import Monitor from '../../logic/monitor'
import ConfigStore from '../../../main/config-store'
import analytics from '../../logic/utils/analytics'
import Logger from '../../../libs/logger'
import path from 'path'
import electronLog from 'electron-log'
import VToolTip from 'v-tooltip'
import DeviceLock from '../../logic/devicelock'
import bytes from 'bytes'
import FileStatus from '../FileStatus/FileStatus.vue'
import FileIcon from '../Icons/FileIcon.vue'

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
      LaunchCheck: ConfigStore.get('autoLaunch'),
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
    logout() {
      remote.dialog
        .showMessageBox(remote.getCurrentWindow(), {
          type: 'question',
          buttons: ['Yes', 'No'],
          default: 1,
          cancelId: 1,
          title: 'Dialog',
          message: 'Would you like to remember where your sync folder is the next time you log in?'
        })
        .then(userResponse => {
          if (userResponse.response === 0) {
            remote.app.emit('user-logout', true)
          } else {
            remote.app.emit('user-logout', false)
          }
        })
    },
    // Quit
    quitApp() {
      remote.app.emit('sync-stop')
      remote.app.emit('app-close')
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
    // Change folder
    changeFolder() {
      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory']
      })
      if (newDir && newDir.length > 0 && fs.existsSync(newDir[0])) {
        if (newDir[0] === remote.app.getPath('home')) {
          remote.app.emit(
            'show-error',
            'Internxt do not support syncronization of your home directory. Try to sync any of its content instead.'
          )
          return
        }
        const appDir = /linux/.test(process.platform)
          ? remote.app.getPath('appData')
          : path.dirname(remote.app.getPath('appData'))
        const relative = path.relative(appDir, newDir[0])
        if (
          (relative &&
            !relative.startsWith('..') &&
            !path.isAbsolute(relative)) ||
          appDir === newDir[0]
        ) {
          remote.app.emit(
            'show-error',
            'Internxt do not support syncronization of your appData directory or anything inside of it.'
          )
          return
        }
        this.path = newDir[0]
        remote.app.emit('new-folder-path', newDir[0])
      } else {
        Logger.info('Sync folder change error or cancelled')
      }
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
    // Open logs
    openLogs() {
      try {
        const logFile = electronLog.transports.file.getFile().path
        const logPath = path.dirname(logFile)
        remote.shell.openPath(logPath)
      } catch (e) {
        Logger.error('Error opening log path: %s', e.message)
      }
    },
    // Launch at login
    launchAtLogin() {
      this.LaunchCheck = !this.LaunchCheck
      remote.app.emit('update-configStore', { autoLaunch: this.LaunchCheck })
      remote.app.emit('change-auto-launch', this.LaunchCheck)
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
    UnlockDevice() {
      DeviceLock.unlock()
      // Unlock ui
      remote.app.emit('ui-sync-status', 'default')
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
    }
  },
  components: {
    UilSetting,
    UilUserCircle,
    UilFolderNetwork,
    InternxtBrand,
    UilMultiply,
    UilFolderOpen,
    UilSync,
    UilServerConnection,
    UilFileTimes,
    UilSlidersVAlt,
    FileIcon
  }
}
</script>
