<template>
  <div class="h-full">
    <div class="bg-white flex justify-center py-2 border-b-2 border-gray-100">
      <settings-header-item
        title="General"
        :icon="UilSetting"
        @click="active = 'general'"
        :active="active === 'general'"
      />
      <settings-header-item
        title="Account"
        :icon="UilAt"
        :active="active === 'account'"
        @click="active = 'account'"
      />
      <settings-header-item
        title="Backups"
        :active="active === 'backups'"
        :icon="UilHistory"
        @click="active = 'backups'"
      />
    </div>
    <div class="p-10 bg-gray-50" style="height: calc(100% - 93px)">
      <div v-if="active === 'general'">
        <DevicePanel />
        <div class="my-3">
          <div @click="launchAtLogin()" class="mt-4">
            <Checkbox
              :forceStatus="LaunchCheck ? 'checked' : 'unchecked'"
              label="Start Internxt Drive on system startup"
            />
          </div>
        </div>
        <div class="text-gray-500 text-sm">Internxt Drive Folder</div>
        <div class="flex flex-col mt-2">
          <div class="flex flex-row items-center justify-between flex-grow">
            <div class="flex items-center" @dblclick="openFolder()">
              <FileIcon icon="folder" class="mr-2" width="20" height="20" />
              <span>{{ this.path }}</span>
            </div>
            <Button @click="changeFolder">Change folder</Button>
          </div>
        </div>
        <div class="border-t-2 border-gray-100 mt-4 pt-4">
          <p class="text-sm font-semibold tracking-wide text-gray-600">
            Internxt Drive v{{ appVersion }}
          </p>
          <p
            class="text-blue-600 cursor-pointer text-lg mt-1"
            @click="openLogs"
          >
            Open logs
          </p>
          <p class="text-blue-600 cursor-pointer text-lg mt-1">
            Learn more about Internxt Drive
          </p>
        </div>
      </div>
      <div v-if="active === 'account'">
        <div v-if="user" class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="
                h-16
                w-16
                flex
                justify-center
                items-center
                rounded-full
                text-blue-600
                bg-blue-200
                text-2xl
                font-semibold
              "
            >
              <p>
                {{ nameToInitials(userFullname).toUpperCase() }}
              </p>
            </div>
            <div class="ml-4">
              <p class="font-semibold text-2xl text-gray-700 tracking-wide">
                {{ userFullname }}
              </p>
              <p class="tracking-wide">{{ user.email }}</p>
            </div>
          </div>
          <Button @click="logout">Log out</Button>
        </div>
        <div
          class="p-4 mt-4 bg-gray-100 border border-gray-400 rounded-xl"
          v-if="limit && usage"
        >
          <div class="flex justify-between items-center">
            <div>
              <div class="flex items-center">
                <p class="text-xl font-semibold mr-2 tracking-wide">
                  Current Plan
                </p>
                <div class="px-2 rounded bg-gray-200 text-sm text-gray-500">
                  Individual
                </div>
              </div>
              <div class="mt-1 flex items-center">
                <div class="text-2xl text-gray-600 font-semibold tracking-wide">
                  {{ limit }}
                </div>
                <!-- <div class="text-gray-400 text-lg tracking-wide ml-3">
                  $41.88 billed annually
                </div> -->
              </div>
            </div>
            <Button state="accent">Upgrade</Button>
          </div>
          <div class="progress mt-4 h-1">
            <div
              class="progress-bar bg-blue-600"
              role="progressbar"
              :style="`width: ${percentageUsed}%`"
            ></div>
          </div>
          <div class="flex justify-between align-center mt-2 text-sm">
            <p class="font-semibold tracking-wide text-gray-600">
              Used {{ usage }} of {{ limit }}
            </p>
            <p class="text-gray-500">{{ percentageUsed }}% in use</p>
          </div>
        </div>
      </div>
      <backups-section v-if="active === 'backups'" />
    </div>
  </div>
</template>

<script>
import database from '../../database/index'
import DeviceLock from '../logic/devicelock'
import FileIcon from './Icons/FileIcon.vue'
import fs from 'fs'
import path from 'path'
import ConfigStore from '../../main/config-store'
import electronLog from 'electron-log'
import Logger from '../../libs/logger'
import Checkbox from './Icons/Checkbox.vue'
import SettingsHeaderItem from './Settings/SettingsHeaderItem.vue'
import {
  UilSetting,
  UilAt,
  UilHistory
} from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import PackageJson from '../../../package.json'
import bytes from 'bytes'
import SpaceUsage from '../logic/utils/spaceusage'
import DevicePanel from '../components/Settings/DevicePanel.vue'
import BackupsSection from './Settings/BackupsSection.vue'
const remote = require('@electron/remote')

export default {
  components: {
    FileIcon,
    Checkbox,
    SettingsHeaderItem,
    Button,
    DevicePanel,
    BackupsSection
  },
  data() {
    return {
      path: '',
      LaunchCheck: ConfigStore.get('autoLaunch'),
      UilSetting,
      UilAt,
      UilHistory,
      active: 'general',
      user: null,
      usage: '',
      limit: ''
    }
  },
  mounted() {
    database.Get('xPath').then(path => {
      this.$data.path = path
    })

    database.Get('xUser').then(({user}) => {
      this.user = user
    })
    remote.app.on('update-storage', data => {
      this.usage = data.usage
      this.limit = data.limit
    })
    SpaceUsage.updateUsage()
  },
  methods: {
    UnlockDevice() {
      DeviceLock.unlock()
      // Unlock ui
      remote.app.emit('ui-sync-status', 'default')
    },
    // Open Filelogger log (activity of uploads, downloads, etc)
    openFileloggerLog() {
      remote.shell.openPath(path.join(__dirname, '../../../../database/fileLogger'))
    },
    // Open folder path
    openFolder() {
      remote.app.emit('open-folder')
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
    // Launch at login
    launchAtLogin() {
      this.LaunchCheck = !this.LaunchCheck
      remote.app.emit('update-configStore', { autoLaunch: this.LaunchCheck })
      remote.app.emit('change-auto-launch', this.LaunchCheck)
    },
    openLinkBilling() {
      remote.shell.openExternal('https://drive.internxt.com/storage')
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
    nameToInitials(fullName) {
      const namesArray = fullName.trim().split(' ')
      if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
      else return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
    }
  },
  computed: {
    isProduction() {
      return process.env.NODE_ENV === 'production'
    },
    appVersion() {
      return PackageJson.version
    },
    userFullname() {
      if (!this.user) { return '' }

      return this.user.name + ' ' + this.user.lastname
    },
    percentageUsed() {
      return ((bytes.parse(this.usage) / bytes.parse(this.limit)) * 100).toFixed(2)
    }
  }

}
</script>