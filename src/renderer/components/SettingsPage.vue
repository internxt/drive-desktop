<template>
  <div ref="rootElement" class="relative">
    <div class="relative bg-white p-1 h-6" style="-webkit-app-region: drag">
      <exit-window-button v-if="!isMacOS" @click="closeWindow" />
      <p
        class="text-sm"
        style="position:absolute;top:4px;left:50%; transform: translateX(-50%);"
      >
        Internxt Drive
      </p>
    </div>
    <div
      class="bg-white flex justify-center py-2 border-b-2 border-gray-100"
      style="-webkit-app-region: drag"
    >
      <settings-header-item
        title="General"
        @click="active = 'general'"
        :active="active === 'general'"
      >
        <UilSetting size="27px" />
      </settings-header-item>
      <settings-header-item
        title="Account"
        :active="active === 'account'"
        @click="active = 'account'"
        ><UilAt size="27px"
      /></settings-header-item>
      <settings-header-item
        title="Backups"
        :active="active === 'backups'"
        @click="active = 'backups'"
      >
        <BackupIcon size="27" :state="backupStatus" />
      </settings-header-item>
    </div>
    <div class="p-8">
      <keep-alive>
        <component :is="currentSection" :backupStatus="backupStatus" />
      </keep-alive>
    </div>
    <Dialog v-if="$store.state.ui.settingsDialog" />
  </div>
</template>

<script>
import SettingsHeaderItem from './Settings/SettingsHeaderItem.vue'
import { UilSetting, UilAt, UilHistory } from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import BackupsSection from './Settings/BackupsSection.vue'
import AccountSection from './Settings/AccountSection.vue'
import GeneralSection from './Settings/GeneralSection.vue'
import Dialog from './Settings/Dialog.vue'
import BackupIcon from './Icons/BackupIcon.vue'
import ExitWindowButton from './ExitWindowButton/ExitWindowButton.vue'
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
    UilSetting,
    UilAt,
    UilHistory,
    BackupIcon,
    Dialog,
    ExitWindowButton
  },
  data() {
    return {
      active: 'general',
      backupStatus: ''
    }
  },
  mounted() {
    const queryParams = new URLSearchParams(location.href.split('?')[1])
    const section = queryParams.get('section')
    this.setActive(section)
    remote.app.on('settings-change-section', this.setActive)

    const resizeObserver = new ResizeObserver(([rootElement]) =>
      this.emitResize({
        width: rootElement.borderBoxSize[0].inlineSize,
        height: rootElement.borderBoxSize[0].blockSize
      })
    )

    resizeObserver.observe(this.$refs.rootElement)

    ipcRenderer.invoke('get-backup-status').then(this.setBackupStatus)
    remote.app.on('backup-status-update', this.setBackupStatus)
  },
  beforeDestroy() {
    remote.app.removeListener('settings-change-section', this.setActive)
    remote.app.removeListener('backup-status-update', this.setBackupStatus)
  },
  methods: {
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
    },
    setBackupStatus(val) {
      this.backupStatus = val
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
