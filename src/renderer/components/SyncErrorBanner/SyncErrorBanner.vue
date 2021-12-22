<template>
  <div
    class="px-3 py-2 flex items-center text-xs border-yellow-100 border-b"
    :class="{
      'bg-yellow-50 text-yellow-600': severity === 'WARN',
      'bg-red-50 text-red-600': severity === 'FATAL',
      hidden: errorName === null
    }"
  >
    <img
      v-if="severity === 'WARN'"
      style="width: 20px; height:20px"
      src="../../assets/icons/apple/warn.svg"
    />
    <img
      v-else
      style="width: 20px; height:20px"
      src="../../assets/icons/apple/error.svg"
    />
    <p class="ml-2 mb-0">{{ message }}</p>
  </div>
</template>

<script>
import syncStatus from '../../../sync/sync-status'
import isOnline from '../../../libs/is-online'
const app = require('@electron/remote').app

export default {
  data() {
    return {
      errorName: null
    }
  },
  mounted() {
    app.on('SYNC_NEXT', this.onNext)
    app.on('sync-status-changed', this.onStatusChanged)
  },
  beforeDestroy() {
    app.removeListener('SYNC_NEXT', this.onNext)
    app.removeListener('sync-status-schanged', this.onStatusChanged)
  },
  methods: {
    async onNext({ result }) {
      if (result.status === 'FATAL_ERROR') {
        this.errorName = result.errorName
      } else if (result.status === 'COULD_NOT_ACQUIRE_LOCK') {
        this.errorName = (await isOnline())
          ? 'COULD_NOT_ACQUIRE_LOCK'
          : 'NO_INTERNET'
      }
    },
    onStatusChanged(status) {
      if (status === syncStatus.RUNNING) this.errorName = null
    }
  },
  computed: {
    severity() {
      return this.errorName === 'COULD_NOT_ACQUIRE_LOCK' ? 'WARN' : 'FATAL'
    },
    message() {
      switch (this.errorName) {
        case 'COULD_NOT_ACQUIRE_LOCK':
          return "Looks like other of your devices is already syncing, we'll try again later"
        case 'NO_INTERNET':
          return "Looks like you are not connected to the internet, we'll try again later"
        case 'NO_REMOTE_CONNECTION':
          return "We could not connect to Internxt servers, we'll try again later"
        case 'CANNOT_GET_CURRENT_LISTINGS':
          return "We could not get the status of your current files, we'll try again later"
        case 'CANNOT_ACCESS_BASE_DIRECTORY':
          return 'We could not access your Internxt Drive local folder'
        case 'CANNOT_ACCESS_TMP_DIRECTORY':
          return 'We could not access your Internxt Drive local folder'
        default:
          return 'An unknown error ocurred while trying to sync your files'
      }
    }
  }
}
</script>
