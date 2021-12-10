<template>
  <div ref="rootElement" class="relative">
    <div class="relative bg-white p-1 h-6" style="-webkit-app-region: drag">
      <div
        v-if="!isMacOS"
        class="w-min"
        @click="closeWindow"
        style="-webkit-app-region: no-drag"
      >
        <UilMultiply class="hover:text-gray-500 block" />
      </div>
      <p
        class="text-sm"
        style="position:absolute;top:4px;left:50%; transform: translateX(-50%);"
      >
        Sync issues
      </p>
    </div>
    <div
      class="bg-white flex justify-center py-2 border-b-2 border-gray-100"
      style="-webkit-app-region: drag"
    ></div>
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
    return {}
  },
  mounted() {},
  beforeDestroy() {},
  methods: {
    closeWindow() {
      remote.app.emit('close-sync-issues-window')
    }
  },
  computed: {
    isMacOS() {
      return process.platform === 'darwin'
    }
  }
}
</script>
