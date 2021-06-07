<template>
  <div>
    <div class="flex justify-between p-4">
      <div class="flex">
        <div>
          <div class="flex">
            <span
              ><InternxtBrand class="mt-0-64 mr-1.5" :width="16" :height="16"
            /></span>
            <div class="text-gray-800 text-xl font-extrabold">
              {{ appName }}
            </div>
          </div>
          <div class="text-sm text-gray-600">{{ SubtitleApp }}</div>
        </div>
      </div>

      <div class="flex">
        <!-- {{ this.$data.localPath }} -->
        <div @click="openFolder()">
          <UilFolderNetwork
            class="mr-3 fill-current text-blue-600 cursor-pointer"
            size="24px"
          />
        </div>
        <div v-on:click="ShowModalSettings()">
          <UilSetting
            class="mr-3 fill-current text-blue-600 cursor-pointer"
            size="24px"
          />
        </div>
        <div v-on:click="ShowModalAccount()">
          <UilUserCircle
            class="fill-current text-blue-600 cursor-pointer"
            size="24px"
          />
        </div>
      </div>
    </div>

    <!-- Modal settings -->
    <div
      v-if="showModal === true"
      class="bg-white p-4 w-full absolute z-10 rounded-t-2xl h-19r"
    >
      <div>
        <div class="flex justify-between">
          <div class="subTitle font-semibold mb-3">Configuration</div>
          <div class="cursor-pointer" v-on:click="CloseModalSettings()">
            <UilMultiply class="mr-2 text-blue-600" />
          </div>
        </div>
      </div>

      <div>Sync mode</div>
      <form class="mt-2 mb-2">
        <div>
          <input
            type="radio"
            id="contactChoice1"
            name="contact"
            value=false
            @click="syncModeChange"
          />
          <label for="contactChoice1">Full sync</label>
        </div>

        <div>
            <input
              type="radio"
              id="contactChoice1"
              name="contact"
              value=true
              @click="syncModeChange"
            />
          <label for="contactChoice1">Upload only</label>
        </div>
      </form>

      <div class="mb-2">Change sync folder</div>
      <div class="flex">
        <div class="flex">
          <UilFolderOpen class="text-blue-600 mr-2 mt-0.5" />
          <div class="text-gray-500">/home/desktop/myfolder</div>
        </div>
        <div v-on:click="changeFolder()" class="text-blue-600 ml-8 cursor-pointer">Change</div>
      </div>

      <div class="mt-2"><input class="mr-2" type="checkbox" v-on:click="launchAtLogin()"/>Launch at login</div>
    </div>

    <!-- Modal Account -->
    <div
      v-if="showModalAccount === true"
      class="bg-white p-4 w-full absolute z-10 rounded-t-2xl h-19r"
    >
      <div class="flex justify-between">
        <div class="subTitle font-semibold mb-3">Configuration</div>
        <div class="cursor-pointer" v-on:click="CloseModalAccount()">
          <UilMultiply class="mr-2 text-blue-600" />
        </div>
      </div>

      <div v-on:click="openLogs()" class="mb-3 hover:text-blue-600 cursor-pointer">Open logs</div>
      <div class="mb-3">Contact support</div>
      <div class="mb-3 hover:text-blue-600 cursor-pointer" @click="logout()">
        Log out
      </div>
      <div class="hover:text-blue-600 cursor-pointer" @click="quitApp()">
        Quit
      </div>
    </div>
  </div>
</template>

<script>
import '../Header/Header.scss'
import FolderIcon from '../ExportIcons/FolderIcon'
import ConfigIcon from '../ExportIcons/ConfigIcon'
import fs from 'fs-extra'
import {
  UilFolderNetwork,
  UilSetting,
  UilUserCircle,
  UilMultiply,
  UilFolderOpen
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

FileLogger.on('update-last-entry', (item) => console.log(item))
const remote = require('@electron/remote')

export default {
  data() {
    return {
      placement: 'left',
      showModal: false,
      showModalAccount: false,
      localPath: ''
    }
  },
  beforeDestroy: function () {
    remote.app.removeAllListeners('user-logout')
  },
  created: function () {
    FileLogger.on('update-last-entry', (item) => {
      this.file = item
    })
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
    this.getLocalFolderPath()
    this.getCurrentEnv()
    remote.app.on('set-tooltip', this.setTooltip)
    console.log('Filelogger', this.file)
    remote.app.on('user-logout', async (saveData = false) => {
      remote.app.emit('sync-stop')
      await database.logOut(saveData)
      const localUser = ConfigStore.get('user.uuid')
      if (localUser) {
        analytics
          .track({
            event: 'user-signout',
            userId: undefined,
            platform: 'desktop',
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
      remote.app.emit('sync-stop')
      await database.ClearAll()
      await database.Set('lastSyncSuccess', false)
      database.Set('xPath', newPath)
      this.$router.push('/').catch(() => {})
    })
  },
  methods: {
    debug() {
      // console.log(appName)
    },
    logout() {
      remote.app.emit('user-logout')
    },
    quitApp() {
      remote.app.emit('app-close')
    },
    afterVisibleChange(val) {
      console.log('visible', val)
    },
    showDrawer() {
      this.visible = true
    },
    onClose() {
      this.visible = false
    },
    // Open modal account
    ShowModalAccount() {
      this.showModalAccount = !this.showModalAccount
      return console.log(this.showModalAccount)
    },
    // Close modal account
    CloseModalAccount() {
      this.showModalAccount = false
    },
    // Open modal Settings
    ShowModalSettings() {
      console.log('click')
      this.showModal = !this.showModal
      return console.log(this.showModal)
    },
    // Close Modal Settings
    CloseModalSettings() {
      this.showModal = false
    },
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
    syncModeChange (check) {
      ConfigStore.set('uploadOnly', check.checked)
      if (!check.checked) {
        ConfigStore.set('forceUpload', 2)
        remote.app.emit('show-info', 'Next sync will also be upload only for checking which file should not delete.')
      } else {
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
    launchAtLogin (check) {
      ConfigStore.set('autoLaunch', check.checked)
      remote.app.emit('change-auto-launch')
    }
  },
  name: 'Header',
  props: {
    appName: {
      type: String,
      default: 'Internxt'
    },
    SubtitleApp: {
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
    UilFolderOpen
    // Drawer
  }
}
</script>

