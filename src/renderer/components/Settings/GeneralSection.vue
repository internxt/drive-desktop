<template>
  <div>
    <DevicePanel />
    <div class="my-3">
      <div @click="launchAtLogin" class="mt-4">
        <Checkbox
          :forceStatus="LaunchCheck ? 'checked' : 'unchecked'"
          label="Start Internxt Drive on system startup"
        />
      </div>
    </div>
    <div class="text-gray-500 text-sm">Internxt Drive folder location</div>
    <div class="flex flex-col mt-2">
      <div class="flex flex-row items-center justify-between flex-grow">
        <div class="flex items-center overflow-hidden" @dblclick="openFolder">
          <FileIcon icon="folder" class="mr-2" width="20" height="20" />
          <span class="truncate">{{ this.parentOfSyncRoot }}</span>
        </div>
        <Button @click="changeFolder">Change folder</Button>
      </div>
    </div>
    <div class="border-t-2 border-gray-100 mt-3 pt-3">
      <p class="text-xs font-semibold tracking-wide text-gray-600">
        Internxt Drive v{{ appVersion }}
      </p>
      <p class="text-blue-600 cursor-pointer text-sm mt-1" @click="openLogs">
        Open logs
      </p>
      <p
        class="text-blue-600 cursor-pointer text-sm mt-1"
        @click="openDriveWeb"
      >
        Learn more about Internxt Drive
      </p>
    </div>
  </div>
</template>

<script>
import fs from 'fs'
import path from 'path'
import ConfigStore from '../../../main/config-store'
import DevicePanel from '../../components/Settings/DevicePanel.vue'
import Button from '../Button/Button.vue'
import FileIcon from '../Icons/FileIcon.vue'
import Checkbox from '../Icons/Checkbox.vue'
import Logger from '../../../libs/logger'
import electronLog from 'electron-log'
import PackageJson from '../../../../package.json'
import analytics from '../../logic/utils/analytics'
import electron from 'electron'
const remote = require('@electron/remote')

export default {
  components: {
    FileIcon,
    DevicePanel,
    Button,
    Checkbox
  },
  data() {
    return {
      path: ConfigStore.get('syncRoot'),
      LaunchCheck: ConfigStore.get('autoLaunch')
    }
  },
  methods: {
    changeFolder() {
      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory'],
        defaultPath: this.path
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
        analytics.trackSyncFolderChanged({
          old_folder: this.path,
          new_folder: newDir[0]
        })
        this.path = newDir[0]
        ConfigStore.set('syncRoot', this.path + path.sep)
      } else {
        Logger.info('Sync folder change error or cancelled')
      }
    },
    launchAtLogin() {
      this.LaunchCheck = !this.LaunchCheck
      remote.app.emit('update-configStore', { autoLaunch: this.LaunchCheck })
      remote.app.emit('change-auto-launch', this.LaunchCheck)
      analytics.trackStartInternxtOnStartup({
        launch_desktop_app_on_startup: this.LaunchCheck
      })
    },
    openFolder() {
      electron.shell.openPath(this.path)
    },
    openLogs() {
      try {
        const logFile = electronLog.transports.file.getFile().path
        const logPath = path.dirname(logFile)
        remote.shell.openPath(logPath)
      } catch (e) {
        Logger.error('Error opening log path: %s', e.message)
      }
    },
    openDriveWeb() {
      remote.shell.openExternal('https://drive.internxt.com')
    }
  },
  computed: {
    appVersion() {
      return PackageJson.version
    },
    parentOfSyncRoot() {
      const absolutePathOfParent = path.parse(this.path).dir

      return absolutePathOfParent.split(path.sep).pop()
    }
  }
}
</script>
