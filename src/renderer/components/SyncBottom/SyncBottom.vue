<template>
  <div
    class="flex w-full justify-between items-center bg-white sync-bottom"
    style="padding: .3rem 1rem"
  >
    <p class="text-xs">
      {{
        status === 'RUNNING'
          ? 'Synchronizing your files'
          : showUpdatedJustNow
          ? 'Updated just now'
          : ''
      }}
    </p>
    <stop-icon
      v-if="status === 'RUNNING'"
      @click.native="stopSync"
      class="cursor-pointer"
      stopButtonState="active"
    />
    <play-icon
      v-else-if="status === 'STANDBY'"
      @click.native="startSync"
      class="cursor-pointer"
      playButtonState="active"
    />
    <Spinner v-else />
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import PlayIcon from '../ExportIcons/PlayIcon.vue'
import StopIcon from '../ExportIcons/StopIcon.vue'
import Spinner from '../ExportIcons/Spinner.vue'
import syncStatus from '../../../sync/sync-status'
const remote = require('@electron/remote')

export default {
  components: {
    PlayIcon,
    StopIcon,
    Spinner
  },
  data() {
    return {
      status: syncStatus.STANDBY,
      showUpdatedJustNow: false,
      showUpdatedJustNowTimeout: null
    }
  },
  async mounted() {
    this.setStatus(await ipcRenderer.invoke('get-sync-status'))
    remote.app.on('sync-status-changed', this.setStatus)
    remote.app.on('SYNC_NEXT', this.onNext)
  },
  beforeDestroy() {
    remote.app.removeListener('sync-status-schanged', this.setStatus)
    remote.app.removeListener('SYNC_NEXT', this.onNext)
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
      this.status = null
    },
    onNext({ result }) {
      this.showUpdatedJustNow =
        result.status === 'IN_SYNC' || result.status === 'NOT_IN_SYNC'

      if (this.showUpdatedJustNowTimeout) {
        clearTimeout(this.showUpdatedJustNowTimeout)
      }

      if (this.showUpdatedJustNow) {
        setTimeout(() => (this.showUpdatedJustNow = false), 30 * 1000)
      }
    }
  }
}
</script>

<style>
.sync-bottom {
  border-top: 1px solid rgb(233, 233, 233);
}
</style>
