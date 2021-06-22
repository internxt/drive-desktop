<template>
  <div class="flex justify-between p-4 px-6">

    <div class="flex">
      <div v-if="syncState === true" class="text-4xl mr-4 text-gray-500">
        <UilCloudDataConnection class="animate-pulse" />
      </div>

      <div v-else class="text-4xl mr-4 text-gray-400">
        <UilCloudDataConnection />
      </div>

      <div v-if="syncState === true" class="text-gray-500 select-none">

        <div>
          <div>Synchronizing your files</div>
          <div>Status: pending...</div>
        </div>

      </div>

      <div class="text-gray-500 select-none" v-else>
        <div>Start sync your files</div>
        <div class="flex">Status: <span class="text-green-500"><UilCheckCircle class="text-green-500 ml-1 mr-0.5 mt-0.5" /></span><span class="text-green-500">Updated</span></div>
      </div>
    </div>


    <div class="flex justify-center">
      <div v-if="syncState === true" class="flex">
        <div class="bg-blue-300 rounded-full p-2.5 w-10 h-10 mr-1">
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
        <div @click="stopSync()">
          <UilStopCircle
            class="w-10 h-10 fill-current text-white bg-blue-600 text-3xl p-2 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"
          />
        </div>

      </div>

      <div v-else class="flex">
        <div @click="forceSync()">
          <UilPlayCircle
            class="w-10 h-10 mr-1 fill-current text-white bg-blue-600 text-3xl p-2 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"
          />
        </div>
        <div>
          <UilStopCircle
            class="w-10 h-10 fill-current text-white bg-gray-200 text-3xl p-2 rounded-full cursor-not-allowed"
          />
        </div>

      </div>
    </div>


  </div>
</template>

<script>
import { UilCloudDataConnection, UilPlayCircle, UilStopCircle, UilCheckCircle } from '@iconscout/vue-unicons'
import './SyncButtonAction.scss'
import ConfigStore from '../../../main/config-store'

const remote = require('@electron/remote')

export default {
  data() {
    return {
      syncState: ConfigStore.get('stopSync'),
      changeSyncButton: (isSyncing) => {
        this.syncState = isSyncing
      }
    }
  },
  props: {
    // setUpdateFlag: {
    //   type: Function,
    //   required: false
    // }
  },
  methods: {
    cambiarEstado() {},
    debug() {
    },
    forceSync() {
      remote.app.emit('sync-start')
      // this.syncState = true
      // this.setUpdateFlag()
    },
    // Stop forceSync
    StopForceSync() {
      remote.app.on('sync-off', (_) => {
        // TODO
      })
    },
    // Stop sync
    stopSync() {
      remote.app.emit('sync-stop')
    }
  },
  created: function () {
    remote.app.on('sync-on', this.changeSyncButton)
    remote.app.on('sync-off', this.changeSyncButton)
  },
  beforeDestroy: function() {
    remote.app.removeListener('sync-off', this.changeSyncButton)
    remote.app.removeListener('sync-on', this.changeSyncButton)
  },
  updated: function () {
  },
  computed: {},
  name: 'SyncButtonAction',
  components: {
    UilCloudDataConnection,
    UilPlayCircle,
    UilStopCircle,
    UilCheckCircle
  }
}
</script>
