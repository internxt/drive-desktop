<template>
  <div class="flex justify-between p-4 px-6">
    <div class="flex">
      <syncStatusText :msg="message" :syncState="syncState" />

      <!-- Error - string= 'error' -->
    </div>
    <div class="flex justify-center">
      <div class="flex">
        <div v-if="this.playButtonState !== 'loading'" @click="forceSync()">
          <PlayIcon :playButtonState="playButtonState" />
        </div>
        <div v-else>
          <LoadingSpinAnimation />
        </div>
        <div @click="stopSync()">
          <StopIcon :stopButtonState="stopButtonState" />
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
      message: {},
      changeSyncButton: isSyncing => {
        this.syncButtonState = isSyncing
      },
      blockTimeout: undefined
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
        this.playButtonState = 'loading'
        this.stopButtonState = 'inactive'
        this.message = getMessage('pending')
        remote.app.emit('sync-start')
      }
    },
    // Stop sync
    stopSync() {
      if (this.stopButtonState === 'active') {
        remote.app.emit('sync-stop')
        this.playButtonState = 'loading'
        this.stopButtonState = 'inactive'
        this.message = getMessage('stop')
      }
    }
  },
  created: function() {
    remote.app.on('ui-sync-status', status => {
      // console.log(`status entering: ${status}`)
      if (status === 'success') {
        clearTimeout(this.blockTimeout)
        this.blockTimeout = 0
        this.playButtonState = 'active'
        this.stopButtonState = 'inactive'
        this.message = getMessage('complete')
      }
      if (status === 'default') {
        this.playButtonState = 'active'
        this.stopButtonState = 'inactive'
        this.message = getMessage('default')
      }

      if (status === 'block') {
        if (!this.blockTimeout) {
          this.blockTimeout = setTimeout(() => {
            this.playButtonState = 'active'
            this.blockTimeout = 0
          }, 60 * 1000)
        }
        this.playButtonState = 'inactive'
        this.stopButtonState = 'inactive'
        this.message = getMessage('block')
        // console.log('%c SYNC BLOCKED', 'color: #FF0000')
      }
      /*
      if (status === 'error') {
        this.playButtonState = 'active'
        this.stopButtonState = 'inactive'
        this.message = getMessage('error')
      }
      */
      if (status === 'pending') {
        clearTimeout(this.blockTimeout)
        this.blockTimeout = 0
        this.playButtonState = 'loading'
        this.stopButtonState = 'active'
        this.message = getMessage('pending')
      }
    })
    // remote.app.on('ui-sync-status', this.changeSyncStatus)
  },
  beforeDestroy: function() {
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
