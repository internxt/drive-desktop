<template>
  <div class="overflow-hidden">
    <div class="flex justify-between items-start p-4">
      <div class="flex flex-col">
        <div class="flex items-center">
          <InternxtBrand :width="16" :height="16"/>
          <div class="text-gray-800 text-xl font-extrabold ml-1.5">{{ appName }}</div>
        </div>

        <div class="text-sm text-gray-500">{{ emailAccount }}</div>
      </div>

      <div class="flex items-center justify-center">
        <!-- {{ this.$data.localPath }} -->
        <!-- <div v-tooltip="{ content: 'Tooltip content here',}" @click="openFolder()"> -->
        <div class="mr-3 cursor-pointer" @click="openFolder()" v-tooltip="{
          content: 'Sync folder',
          placement: 'bottom',
          delay: { show: 300, hide: 300}
        }">
          <UilFolderNetwork
            class="text-blue-600"
            size="24px"
          />
        </div>

        <div class="mr-3 cursor-pointer" v-on:click="ShowSettingsModal()" v-tooltip="{
          content: 'Settings',
          placement: 'bottom',
          delay: { show: 300, hide: 300}
        }">
          <UilSetting
            class="text-blue-600"
            size="24px"
          />
        </div>

        <div class="cursor-pointer" v-on:click="ShowAccountModal()" v-tooltip="{
          content: 'Account',
          placement: 'bottom',
          delay: { show: 300, hide: 300}
        }">
          <UilUserCircle
            class="text-blue-600"
            size="24px"
          />
        </div>
      </div>
    </div>

    <!-- Modal settings -->
    <transition
      enter-class="enter"
      enter-to-class="enter-to"
      enter-active-class="slide-enter-active"
      leave-class="leave"
      leave-to-class="leave-to"
      leave-active-class="slide-leave-active"
    >
      <div v-if="showSettingsModal === true" class="bg-white p-4 px-6 w-full h-full fixed rounded-t-2xl z-10">
        <div class="flex justify-between">
          <div class="text-black text-base font-bold mb-3">Configuration</div>

          <div class="cursor-pointer" v-on:click="CloseSettingsModal()">
            <UilMultiply class="mr-2 text-blue-600" />
          </div>
        </div>

        <span class="text-sm text-black">Sync mode</span>
        <form class="mt-2 mb-2">
          <div>
            <input
              type="radio"
              id="contactChoice1"
              name="contact"
              value="full"
              v-model="CheckedValue"
              @change="syncModeChange()"
            />
            <label class="text-xs text-gray-500 cursor-pointer" for="contactChoice1">Full sync</label>
          </div>

          <div>
            <input
              type="radio"
              id="contactChoice2"
              name="contact"
              value="upload"
              v-model="CheckedValue"
              @change="syncModeChange()"
            />
            <label class="text-xs text-gray-500 cursor-pointer" for="contactChoice2">Upload only</label>
          </div>
        </form>

        <div class="text-sm mt-3">Change sync folder</div>
        <div class="flex items-center mt-2">
          <div class="flex items-center">
            <div><UilFolderOpen class="text-blue-600 mr-2 mt-0.5" /></div>
            <div class="text-xs text-gray-500">{{this.path}}</div>
          </div>
          <div v-on:click="changeFolder()" class="text-sm text-blue-600 ml-8 cursor-pointer">Change</div>
        </div>

        <label class="checkbox mt-3">
          <input type="checkbox" v-model="LaunchCheck" value="true" v-on:change="launchAtLogin()">
          <span class="ml-2 text-gray-700">Launch at login</span>
        </label>
      </div>
    </transition>

    <!-- Modal Account -->
    <transition
      enter-class="enter"
      enter-to-class="enter-to"
      enter-active-class="slide-enter-active"
      leave-class="leave"
      leave-to-class="leave-to"
      leave-active-class="slide-leave-active"
    >
      <div v-if="showAccountModal === true" class="bg-white p-4 px-6 w-full h-full fixed rounded-t-2xl z-10">
        <div class="flex justify-between">
          <div class="text-black text-base font-bold mb-3">Account</div>
          <div class="cursor-pointer" v-on:click="CloseAccountModal()">
            <UilMultiply class="mr-2 text-blue-600" />
          </div>
        </div>

        <div v-on:click="openLogs()" class="text-sm mb-3 hover:text-blue-600 cursor-pointer">Open logs</div>
        <div v-on:click="ContactSupportMailto()" class="text-sm hover:text-blue-600 cursor-pointer mb-3">Contact support</div>
        <div class="text-sm mb-3 hover:text-blue-600 cursor-pointer" @click="logout()">Log out</div>
        <div class="text-sm hover:text-blue-600 cursor-pointer" @click="quitApp()">Quit</div>
        <div>
          <div class="text-xs border border-dashed border-gray-200 p-2 px-3 rounded mt-2">

            <div class="flex">
              <div><UilServerConnection class="text-blue-600 text-2xl mr-4 mt-0.5" /></div>
              <div>
                <div class="font-bold">Storage used</div>
                <div class="flex">
                  <div class="mr-0.5 text-gray-400 text-xs-bolder"><strong>{{usage}}</strong> de </div>
                  <div class="text-blue-500 text-xs-bolder">{{limit}}</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </transition>
  </div>

</template>

<script>
import Vue from 'vue'
import '../Header/Header.scss'
import FolderIcon from '../ExportIcons/FolderIcon'
import ConfigIcon from '../ExportIcons/ConfigIcon'
import fs from 'fs-extra'
import {
  UilFolderNetwork,
  UilSetting,
  UilUserCircle,
  UilMultiply,
  UilFolderOpen,
  UilServerConnection
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
import bytes from 'bytes'

Vue.use(VToolTip)
// FileLogger.on('update-last-entry', (item) => console.log(item))
const remote = require('@electron/remote')

export default {
  data() {
    return {
      placement: 'left',
      showSettingsModal: false,
      showAccountModal: false,
      localPath: '',
      CheckedValue: 'full',
      LaunchCheck: false,
      path: null,
      msg: 'Mensaje de texto',
      usage: '',
      limit: ''

    }
  },
  beforeCreate: function () {
    database.Get('xPath').then(path => {
      this.$data.path = path
    })
  },
  beforeDestroy: function () {
    remote.app.removeAllListeners('user-logout')
  },
  created: function () {
    this.$app = this.$electron.remote.app
    // Storage and space used
    remote.app.on('update-storage', (data) => {
      this.usage = data.usage
      this.limit = data.limit
    })
    FileLogger.on('update-last-entry', (item) => {
      this.file = item
    })
    Monitor.Monitor(true)
    // remote.app.on('set-tooltip', this.setTooltip)
    // console.log('Filelogger', this.file)
    remote.app.on('user-logout', async (saveData = false) => {
      remote.app.emit('sync-stop', false)
      await database.logOut(saveData)
      const localUser = ConfigStore.get('user.uuid')
      if (localUser) {
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
          .catch((err) => {
            Logger.error(err)
          })
      }
      remote.app.emit('update-menu')
      this.$router.push('/').catch(() => {})
    })

    remote.app.on('new-folder-path', async (newPath) => {
      remote.app.emit('sync-stop', false)
      await database.ClearAll()
      await database.Set('lastSyncSuccess', false)
      database.Set('xPath', newPath)
      this.$router.push('/').catch(() => {})
    })
  },
  updated: function() {
    // console.log('updated', this.CheckedValue)
  },
  methods: {
    debug() {
    },
    // Log out - save folder path whe user log out
    logout() {
      remote.dialog.showMessageBox(
        new remote.BrowserWindow({
          show: false,
          alwaysOnTop: true,
          width: 400,
          height: 500,
          minWidth: 400,
          minHeight: 500,
          maxWidth: 400,
          maxHeight: 500
        }),
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          default: 1,
          cancelId: 1,
          title: 'Dialog',
          message: 'Would you like to save your login data'
        }
      )
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
      remote.app.emit('sync-stop', false)
      remote.app.emit('app-close')
    },
    afterVisibleChange(val) {
    },
    showDrawer() {
      this.visible = true
    },
    onClose() {
      this.visible = false
    },
    // Open modal account
    ShowAccountModal() {
      this.showSettingsModal = false
      this.showAccountModal = !this.showAccountModal
    },
    CloseAccountModal() {
      this.showAccountModal = false
    },
    // Open modal Settings
    ShowSettingsModal() {
      this.showAccountModal = false
      this.showSettingsModal = !this.showSettingsModal
    },
    CloseSettingsModal() {
      this.showSettingsModal = false
    },
    // Open folder path
    openFolder() {
      remote.app.emit('open-folder')
    },
    // Launch folder path
    getLocalFolderPath() {
      database
        .Get('xPath')
        .then((path) => {
          this.$data.localPath = path
        })
        .catch((err) => {
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
        remote.app.emit('new-folder-path', newDir[0])
      } else {
        Logger.info('Sync folder change error or cancelled')
      }
    },
    // Full sync - Upload only Sync mode
    syncModeChange () {
      if (this.CheckedValue === 'full') {
        ConfigStore.set('forceUpload', 2)
        remote.app.emit('show-info', 'Next sync will also be upload only for checking which file should not delete.')
      } else {
        ConfigStore.set('uploadOnly', true)
        remote.app.emit('show-info', 'By changing to Upload only you can only upload files in next sync. You can delete files locally without lose them from your cloud.')
      }
    },
    // Open logs
    openLogs () {
      try {
        const logFile = electronLog.transports.file.getFile().path
        const logPath = path.dirname(logFile)
        remote.shell.openPath(logPath)
      } catch (e) {
        Logger.error('Error opening log path: %s', e.message)
      }
    },
    // Launch at login
    launchAtLogin () {
      // console.log(this.LaunchCheck) // Pasar aqui lo que sea
      // if (this.LaunchCheck === true) {
      // }
      ConfigStore.set('autoLaunch', this.LaunchCheck)
      remote.app.emit('change-auto-launch')
    },
    // Contact support
    ContactSupportMailto () {
      remote.shell.openExternal(
        `mailto:idajggytsuz7jivosite@jivo-mail.com?subject=Support Ticket&body=If you want to upload log files to our tech teams. Please, find them on the Open Logs option in the menu.`
      )
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
    FolderIcon,
    ConfigIcon,
    UilSetting,
    UilUserCircle,
    UilFolderNetwork,
    InternxtBrand,
    UilMultiply,
    UilFolderOpen,
    UilServerConnection
    // Drawer
  }
}
</script>

