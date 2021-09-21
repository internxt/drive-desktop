<template>
  <div ref="rootElement">
    <div class="relative bg-white p-1 h-6" style="-webkit-app-region: drag">
      <div v-if="!isMacOS" class="w-min" @click="closeWindow" style="-webkit-app-region: no-drag">
        <UilMultiply class="hover:text-gray-500 block"/>
      </div>
      <p class="text-sm" style="position:absolute;top:4px;left:50%; transform: translateX(-50%);">Internxt Drive</p>
    </div>
    <div class="bg-white flex justify-center py-2 border-b-2 border-gray-100" style="-webkit-app-region: drag">
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
    <div class="p-8">
      <keep-alive>
        <component :is="currentSection"/>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import DeviceLock from '../logic/devicelock'
import path from 'path'
import SettingsHeaderItem from './Settings/SettingsHeaderItem.vue'
import {
  UilSetting,
  UilAt,
  UilHistory,
  UilMultiply
} from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import BackupsSection from './Settings/BackupsSection.vue'
import AccountSection from './Settings/AccountSection.vue'
import GeneralSection from './Settings/GeneralSection.vue'
import Avatar from './Avatar/Avatar.vue'
import { ipcRenderer } from 'electron'
const remote = require('@electron/remote')

export default {
  components: {
    SettingsHeaderItem,
    Button,
    BackupsSection,
    AccountSection,
    GeneralSection,
    Avatar,
    UilMultiply
  },
  data() {
    return {
      UilSetting,
      UilAt,
      UilHistory,
      active: 'general'
    }
  },
  mounted() {
    const section = document.location.href.match(/section=(.+)/)[1]
    this.setActive(section)
    remote.app.on('settings-change-section', this.setActive)

    const resizeObserver = new ResizeObserver(([rootElement]) => this.emitResize({width: rootElement.borderBoxSize[0].inlineSize, height: rootElement.borderBoxSize[0].blockSize}))

    resizeObserver.observe(this.$refs.rootElement)
  },
  beforeDestroy () {
    remote.app.removeAllListeners('new-folder-path')
    remote.app.removeListener('settings-change-section', this.setActive)
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
    openLinkBilling() {
      remote.shell.openExternal('https://drive.internxt.com/storage')
    },
    setActive(section) {
      this.active = section
    },
    closeWindow() {
      remote.app.emit('close-settings-window')
    },
    emitResize(dimensions) {
      ipcRenderer.send('settings-window-resize', dimensions)
    }
  },
  computed: {
    currentSection() {
      switch (this.active) {
        case 'account':
          return AccountSection
        case 'backups':
          return BackupsSection
        default:
          return GeneralSection
      }
    },
    isMacOS() {
      return process.platform === 'darwin'
    }
  }

}
</script>