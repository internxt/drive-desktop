<template>
  <div class="relative flex flex-col h-full" style="background-color: #fafbfc;">
    <div
      class="relative px-1 pt-1 h-6 flex-grow-0"
      style="-webkit-app-region: drag; "
    >
      <div
        v-if="!isMacOS"
        class="w-min"
        @click="closeWindow"
        style="-webkit-app-region: no-drag"
      >
        <UilMultiply class="hover:text-gray-500 block" />
      </div>
      <p
        class="text-sm text-gray-700 tracking-wide"
        style="position:absolute;top:4px;left:50%; transform: translateX(-50%);"
      >
        Sync issues
      </p>
    </div>
    <div
      class="flex justify-between items-center pt-4 pr-3 pl-4 flex-grow-0"
      style="-webkit-app-region: drag"
    >
      <div class="font-bold text-gray-700 tracking-wide text-sm">
        {{ syncIssues.length ? `${syncIssues.length} issues` : 'No issues' }}
      </div>
      <div
        class=" text-gray-600 rounded-md py-1 font-semibold cursor-pointer"
        style="font-size: 12px; -webkit-app-region: no-drag; padding: 4px 11px; background-color: #ebecf0"
      >
        Open log
      </div>
    </div>
    <div class="m-3 p-2 flex-grow rounded-md" style="border: 1px solid #ebecf0">
      <div
        v-if="syncIssues.length === 0"
        class="flex justify-center items-center text-gray-400 text-sm h-full"
      >
        No issues found
      </div>
    </div>
  </div>
</template>

<script>
import {
  UilSetting,
  UilAt,
  UilHistory,
  UilMultiply
} from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import { ipcRenderer } from 'electron'
const remote = require('@electron/remote')

export default {
  components: {
    Button,
    UilMultiply,
    UilSetting,
    UilAt,
    UilHistory
  },
  data() {
    return {
      syncIssues: []
    }
  },
  mounted() {
    ipcRenderer.invoke('getSyncIssues').then(this.setSyncIssues)

    remote.app.on('sync-issues-changed', this.setSyncIssues)
  },
  beforeDestroy() {
    remote.app.removeListener('sync-issues-changed', this.setSyncIssues)
  },
  methods: {
    closeWindow() {
      remote.app.emit('close-sync-issues-window')
    },
    setSyncIssues(newValue) {
      this.syncIssues = newValue
    }
  },
  computed: {
    isMacOS() {
      return process.platform === 'darwin'
    }
  }
}
</script>
