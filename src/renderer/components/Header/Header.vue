<template>
  <div>
    <div class="flex justify-between self-center p-3 pl-4 pr-4" style="-webkit-app-region: drag">
      <div class="flex flex-col" style="-webkit-app-region: no-drag;">
        <div class="flex items-center">
          <img src="../../assets/svg/brand-app.svg" width="40px" height="40px" style="min-width:40px;"/>
          <div class="ml-3 text-sm">
            <div>{{ emailAccount }}</div>
            <div class="flex" v-if="showUsage">
              <div class="mr-0.5">{{ usage }} of {{ limit }}</div>
              <div v-if="this.showUpgrade" class="ml-1 text-blue-60 cursor-pointer" @click="openLinkBilling()">Upgrade</div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center"> <!-- style="-webkit-app-region: no-drag;"-->
        <!-- {{ this.$data.localPath }} -->
        <div
          v-if="!isProduction"
          class="flex items-center justify-center cursor-pointer menuItem"
          :class="{ 'selectedModal' : showModal === 'dev'}"
          v-on:click="toggleModal('dev')"
          v-tooltip="{
            content: 'Developer Tools',
            placement: 'bottom',
            delay: { show: 1000, hide: 50 }
          }"
        >
          <UilSlidersVAlt class="text-blue-600" size="22px" />
        </div>

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
          <UilSync class="text-blue-600" size="22px" />
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
          <UilFolderOpen class="text-blue-600" size="22px" />
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
          <UilSetting class="text-blue-600" size="22px" />
        </div>

      </div>
    </div>

    <!-- SETTINGS MODAL -->
      <div
        v-if="showModal === 'settings'"
        class="bg-white p-6 w-full h-full fixed z-10 overflow-scroll"
      >
        <div class="flex justify-between self-center">
          <div class="text-black text-base font-bold mb-3">Settings</div>

          <div class="cursor-pointer" v-on:click="toggleModal()">
            <UilMultiply class="text-blue-600" size="22px" />
          </div>
        </div>

        <span class="text-sm text-black">Sync mode</span>
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
        <!-- <span class="text-xs bg-blue-600 p-1.5 rounded-full text-white px-3 cursor-pointer hover:bg-blue-800" @click="stopSync()">Stop sync</span> -->

        <div class="text-sm mt-3">Change sync folder</div>
        <div class="flex flex-row items-center justify-between flex-grow mt-2">
          <div class="flex items-center">
            <div><UilFolderOpen class="text-blue-600 mr-2 mb-0.5" /></div>
            <p class="text-xs text-gray-500 break-words w-full">{{ this.path }}</p>
          </div>
          <div v-on:click="changeFolder()" class="text-sm text-blue-600 cursor-pointer">Change</div>
        </div>

        <label class="checkbox mt-3">
          <input
            type="checkbox"
            :checked="LaunchCheck"
            @change="launchAtLogin()"
          />
          <span class="ml-2 text-gray-700">Launch at login</span>
        </label>

        <div class="text-black text-base font-bold mb-3 mt-3">Account</div>

        <div
          class="text-sm cursor-pointer mb-1"
          @click="openLinkBilling()"
        >
          Billing
        </div>

        <div
          class="text-sm mb-1 cursor-pointer"
          @click="openLogs()"
        >
          Open logs
        </div>
        <div
          class="text-sm cursor-pointer mb-1"
          @click="ContactSupportMailto()"
        >
          Contact support
        </div>
        <div
          class="text-sm mb-1 text-blue-600 cursor-pointer"
          @click="logout()"
        >
          Log out
        </div>
        <div
          class="text-sm text-red-60 cursor-pointer"
          @click="quitApp()"
        >
          Quit
        </div>

      </div>

    <!-- SYNC MODAL -->
      <div
        v-if="showModal === 'sync'"
        class="bg-white p-6 px-6 w-full h-full fixed z-10"
      >
        <div class="flex justify-between">
          <div class="flex flex-col">
            <div class="text-black text-base font-bold mb-1">Synced folders</div>
            <div class="text-neutral-500 text-sm mb-3">Internxt Drive folders synced with your computer</div>
          </div>

          <div class="cursor-pointer" v-on:click="toggleModal()">
            <UilMultiply class="text-blue-600" size="22px" />
          </div>
        </div>



      </div>
    <!--
    </transition>
    -->

    <!-- DEV MODAL -->
      <div
        v-if="showModal === 'dev'"
        class="bg-white p-6 px-6 w-full h-full fixed z-10"
      >
        <div class="flex justify-between self-center">
          <div class="text-black text-base font-bold mb-3">Developer Tools</div>
          <div class="cursor-pointer" v-on:click="toggleModal()">
            <UilMultiply class="text-blue-600" size="22px" />
          </div>
        </div>

        <div>
          <a
            class="btn btn-blue"
            @click="UnlockDevice()"
          >
            Unlock device
          </a>
        </div>

        <!-- <div>
          <a
            class="btn btn-blue"
            @click="stopSync()"
          >
            Stop sync
          </a>
        </div> -->

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

Vue.use(VToolTip)
const remote = require('@electron/remote')

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
    UilSlidersVAlt
  }
}
</script>
