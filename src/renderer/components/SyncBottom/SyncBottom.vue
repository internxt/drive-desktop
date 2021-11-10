<template>
	<div class="flex w-full justify-between items-center bg-white border border-t border-gray-50" style="padding: .75rem 1rem">
		<p class="text-sm">{{status === 'RUNNING' ? 'Synchronizing your files' : ''}}</p>
		<stop-icon v-if="status === 'RUNNING'"  @click.native="stopSync" class="cursor-pointer" stopButtonState="active"/>
		<play-icon v-else @click.native="startSync" class="cursor-pointer" playButtonState="active" />
	</div>
</template>

<script>
import { ipcRenderer } from 'electron'
import PlayIcon from '../ExportIcons/PlayIcon.vue'
import StopIcon from '../ExportIcons/StopIcon.vue'
import syncStatus from '../../../sync/sync-status'
const remote = require('@electron/remote')

export default {
  data() {
    return {
      status: syncStatus.STANDBY
    }
  },
  async mounted() {
    this.setStatus(await ipcRenderer.invoke('get-sync-status'))
    remote.app.on('sync-status-changed', this.setStatus)
  },
  beforeDestroy() {
    remote.app.removeListener('sync-status-schanged', this.setStatus)
  },
  methods: {
    setStatus(newStatus) {
      this.status = newStatus
    },
    startSync() {
      ipcRenderer.send('start-sync-process')
    },
    stopSync() {
      ipcRenderer.send('stop-sync-process')
    }
  },
  components: {
    PlayIcon,
    StopIcon
  }
}
</script>