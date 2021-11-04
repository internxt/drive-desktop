<template>
  <div>
    <DevicePanel />
    <div class="my-3">
      <div @click="launchAtLogin()" class="mt-4">
        <Checkbox
          :forceStatus="LaunchCheck ? 'checked' : 'unchecked'"
          label="Start Internxt Drive on system startup"
        />
      </div>
    </div>
    <div class="border-t-2 border-gray-100 mt-3 pt-3">
      <p class="text-xs font-semibold tracking-wide text-gray-600">
        Internxt Drive v{{ appVersion }}
      </p>
      <p
        class="text-blue-600 cursor-pointer text-sm mt-1"
        @click="openLogs"
      >
        Open logs
      </p>
      <p class="text-blue-600 cursor-pointer text-sm mt-1" @click="openDriveWeb">
        Learn more about Internxt Drive
      </p>
    </div>
  </div>

</template>

<script>
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
      LaunchCheck: ConfigStore.get('autoLaunch')
    }
  },
  methods: {
    launchAtLogin() {
      this.LaunchCheck = !this.LaunchCheck
      remote.app.emit('update-configStore', { autoLaunch: this.LaunchCheck })
      remote.app.emit('change-auto-launch', this.LaunchCheck)
      analytics.trackStartInternxtOnStartup({
        launch_desktop_app_on_startup: this.LaunchCheck
      })
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
    }
  }

}
</script>