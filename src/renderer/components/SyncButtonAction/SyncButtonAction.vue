<template>
  <div class="flex justify-between p-4 px-6">
    <div class="flex">

      <syncStatusText :msg = "message" :syncState = "syncState"/>

      <!-- Error - string= 'error' -->
    </div>
    <div class="flex justify-center">
      <div class="flex">
        <div v-if="this.playButtonState !== 'loading'" @click="forceSync()">
          <PlayIcon :playButtonState="playButtonState"/>
        </div>
        <div v-else>
          <LoadingSpinAnimation/>
        </div>
        <div @click="stopSync()">
          <StopIcon  :stopButtonState="stopButtonState"/>
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
import LoadingSpinAnimation from '../ExportIcons/LoadingSpinAnimation'
import syncButtonState from '../../logic/syncButtonStateMachine'
import syncStatusText from './syncStatusText'
import getMessage from './statusMessage'

const remote = require('@electron/remote')

export default {
  data() {
    return {
      syncState: 'default',
      syncButtonState: ConfigStore.get('isSyncing'),
      playButtonState: 'active',
      stopButtonState: 'inactive',
      stopButtonSync: 'inactiveButtonSync',
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
      if (this.playButtonState === 'active') {
        remote.app.emit('sync-start')
      }
    },
    // Stop forceSync
    StopForceSync() {
      remote.app.on('sync-off', _ => {
        // TODO
      })
    },
    // Stop sync
    stopSync() {
      if (this.stopButtonState === 'active') {
        remote.app.emit('sync-stop')
      }
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
    syncStatusText,
    LoadingSpinAnimation
  }
}
</script>
