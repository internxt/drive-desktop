<template>
  <div class="flex justify-between p-4 px-6">
    <!-- <div>{{ this.syncState }}</div><br /> -->
    <div class="flex">

      <syncStatusText :msg = "message"/>

      <!-- Error - string= 'error' -->
    </div>
    <div class="flex justify-center">
      <div v-if="syncButtonState === true" class="flex">
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
          <!-- <StopIcon
            class="w-10 h-10 fill-current text-white bg-blue-600 text-3xl p-2.5 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"
          /> -->
          <StopIcon :class="stopStateButtons"/>
        </div>
      </div>
      <div v-else class="flex">
        <div @click="forceSync()">
          <!-- <PlayIcon
            class="w-10 h-10 mr-1 fill-current text-white bg-blue-600 text-3xl p-2.5 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"
          /> -->
          <PlayIcon :class="playStateButtons"/>
        </div>
        <div>
          <!-- <StopIcon
            class="p-2.5 text-center w-10 h-10 fill-current text-white bg-gray-200 text-3xl rounded-full cursor-not-allowed"
          /> -->
          <StopIcon :class="stopStateButtons"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  UilCloudDataConnection,
  UilPlayCircle,
  UilStopCircle,
  UilCheckCircle
} from '@iconscout/vue-unicons'
import './SyncButtonAction.scss'
import ConfigStore from '../../../main/config-store'
import StopIcon from '../ExportIcons/StopIcon.vue'
import PlayIcon from '../ExportIcons/PlayIcon.vue'
import syncButtonState from '../../logic/syncButtonStateMachine'
import syncStatusText from './syncStatusText'
import getMessage from './statusMessage'

const remote = require('@electron/remote')

export default {
  data() {
    return {
      stopStateButtons: 'inactiveButtonSync',
      playStateButtons: 'inactiveButtonSync',
      syncState: 'default',
      syncButtonState: ConfigStore.get('isSyncing'),
      playButtonState: 'active',
      stopButtonState: 'inactive',
      message: {},
      changeSyncButton: isSyncing => {
        this.syncButtonState = isSyncing
      },
      changeSyncStatus: status => {
        // console.log(`%c Status Change. STATUS: ${this.syncState}, PLAY BUTTON: ${this.playButtonState}, STOP BUTTON: ${this.stopButtonState}, TRANSITION: ${status}`, 'color: #FFA500')
        const { syncState, playButtonState, stopButtonState } = syncButtonState(this.syncState, status)
        this.syncState = syncState
        this.playButtonState = playButtonState
        this.stopButtonState = stopButtonState
        this.message = getMessage(syncState)
        // console.log(`%c NEW STATE: ${this.syncState}, PLAY BUTTON: ${this.playButtonState}, STOP BUTTON: ${this.stopButtonState}`, 'color: #FFA500')
      }
    }
  },
  props: {
    FileStatusSync: {
      type: Array,
      required: false
    }
  },
  methods: {
    forceSync() {
      remote.app.emit('sync-start')
    },
    // Stop forceSync
    StopForceSync() {
      remote.app.on('sync-off', _ => {
        // TODO
      })
    },
    // Stop sync
    stopSync() {
      remote.app.emit('sync-stop')
    }
  },
  created: function() {
    remote.app.on('sync-on', this.changeSyncButton)
    remote.app.on('sync-off', this.changeSyncButton)
    remote.app.on('ui-sync-status', this.changeSyncStatus)
  },
  beforeDestroy: function() {
    remote.app.removeListener('sync-off', this.changeSyncButton)
    remote.app.removeListener('sync-on', this.changeSyncButton)
    remote.app.removeListener('ui-sync-status', this.changeSyncStatus)
  },
  updated: function() {},
  computed: {},
  name: 'SyncButtonAction',
  components: {
    UilCloudDataConnection,
    UilPlayCircle,
    UilStopCircle,
    UilCheckCircle,
    StopIcon,
    PlayIcon,
    syncStatusText
  }
}
</script>
