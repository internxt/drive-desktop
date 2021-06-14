<template>
  <div class="flex items-center justify-center relative">
    <div class="flex justify-center absolute -top-5 centerAbsolute mb-6">
      <div v-if="syncState === true" class="bg-blue-300 rounded-full p-2.5 w-10 h-10 mr-1">
        <svg
          class="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>

      <div @click="forceSync()" v-else class="flex flex-col">
        <UilCloudDataConnection
          class=" w-10 h-10 fill-current text-white bg-blue-600 text-3xl p-2 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"
        />
        <div class="text-center text-xs text-blue-600 mt-1">Sync</div>
      </div>
    </div>

    <div class="mt-14">
      <div v-if="syncState === true" class="text-xs text-gray-500 text-center">
        Synchronizing your files...
      </div>

      <div class="text-xs text-gray-500 text-center" v-else>
        No synchronizations yet. Start by clicking the
        <span class="text-blue-600">Sync</span> button
      </div>
    </div>
  </div>
</template>

<script>
import { UilCloudDataConnection } from '@iconscout/vue-unicons'
import './SyncButtonAction.scss'

const remote = require('@electron/remote')

export default {
  data() {
    return {
      syncState: false,
      changeSyncButton: (isSyncing) => {
        this.syncState = isSyncing
      }
    }
  },
  methods: {
    cambiarEstado() {},
    debug() {
    },
    forceSync() {
      remote.app.emit('sync-start')
      this.syncState = true
    },
    StopForceSync() {
      remote.app.on('sync-off', (_) => {
        // TODO
      })
    }
  },
  updateSyncButton(syncState) {
    this.isSyncing = syncState
  },
  created: function () {
    remote.app.on('sync-off', this.changeSyncButton)
  },
  beforeDestroy: function() {
    remote.app.removeListener('sync-off', this.changeSyncButton)
  },
  updated: function () {
  },
  computed: {},
  name: 'SyncButtonAction',
  props: {},
  components: {
    UilCloudDataConnection
  }
}
</script>
