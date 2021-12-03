<template>
  <div
    style="padding: .75rem"
    class="h-full w-full overflow-y-auto overflow-x-hidden"
  >
    <!-- <div class="flex items-center justify-between mb-3">
      <p class="text-gray-500 text-sm sticky top-0 bg-gray-50"></p>
      <p class="text-gray-500 font-bold text-xs cursor-pointer" @click="clear">
        Clear
      </p>
    </div> -->
    <div class="flex flex-col space-y-4 ">
      <div v-for="item in items" :key="item.name" class="flex items-center">
        <file-icon :width="32" :height="32" class="flex-shrink-0" />
        <div class="ml-2" style="max-width: 85%">
          <p class="text-sm truncate mt-1">
            {{ item.name | showOnlyFilename }}
          </p>
          <p class="text-xs text-gray-600">{{ getStatusMessage(item) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { UilFolder, UilCloud } from '@iconscout/vue-unicons'
import path from 'path'
import FileIcon from '../Icons/FileIcon.vue'
const app = require('@electron/remote').app

export default {
  components: {
    UilFolder,
    UilCloud,
    FileIcon
  },
  data() {
    return {
      items: []
    }
  },
  mounted() {
    app.on('SYNC_INFO_UPDATE', this.onInfoUpdate)
    app.on('SYNC_NEXT', this.onNext)
  },
  beforeDestroy() {
    app.removeListener('SYNC_INFO_UPDATE', this.onInfoUpdate)
    app.removeListener('SYNC_NEXT', this.onNext)
  },
  methods: {
    onInfoUpdate(item) {
      if (
        ![
          'PULL',
          'DELETE',
          'PULLED',
          'DELETED',
          'PULL_ERROR',
          'DELETE_ERROR'
        ].includes(item.action)
      ) {
        return
      }

      const itemIndex = this.items.findIndex(i => i.name === item.name)

      const alreadyExists = itemIndex !== -1

      if (!alreadyExists) {
        this.items = [item, ...this.items.slice(0, 50)]
      } else {
        const itemsCopy = [...this.items]
        itemsCopy[itemIndex] = item
        this.items = itemsCopy
      }
    },
    onNext(item) {
      this.items = []
    },
    clear() {},
    getErrorMessage(item) {
      const { errorName } = item.result

      switch (errorName) {
        case 'NO_INTERNET':
          return 'No internet connection'
        case 'NO_REMOTE_CONNECTION':
          return `Could not connect to Internxt`
        case 'CANNOT_ACCESS_BASE_DIRECTORY':
          return `Check that ${item.localPath} exists and your user has read and write permission there`
        case 'CANNOT_ACCESS_TMP_DIRECTORY':
          return `Could not access to your temporary directory`
        case 'CANNOT_GET_CURRENT_LISTINGS':
          return 'Could not get the content of your folders'
        default:
          return 'An unknown error ocurred'
      }
    },
    getStatusMessage(item) {
      if (item.action === 'PULL' && item.kind === 'REMOTE') {
        return `Uploading (${(item.progress * 100).toFixed(0)}%)`
      } else if (item.action === 'PULL' && item.kind === 'LOCAL') {
        return `Downloading (${(item.progress * 100).toFixed(0)}%)`
      }
      if (item.action === 'PULLED' && item.kind === 'REMOTE') {
        return `Uploaded`
      } else if (item.action === 'PULLED' && item.kind === 'LOCAL') {
        return `Downloaded`
      } else if (item.action === 'PULL_ERROR' && item.kind === 'LOCAL') {
        return 'Error while downloading'
      } else if (item.action === 'PULL_ERROR' && item.kind === 'REMOTE') {
        return 'Error while uploading'
      } else if (item.action === 'DELETE' && item.kind === 'LOCAL') {
        return `Deleting from your computer`
      } else if (item.action === 'DELETE' && item.kind === 'REMOTE') {
        return `Deleting from Internxt Drive`
      } else if (item.action === 'DELETED' && item.kind === 'LOCAL') {
        return `Deleted from your computer`
      } else if (item.action === 'DELETED' && item.kind === 'REMOTE') {
        return `Deleted from Internxt Drive`
      } else if (item.action === 'DELETE_ERROR' && item.kind === 'LOCAL') {
        return 'Error while deleting from your computer'
      } else if (item.action === 'DELETE_ERROR' && item.kind === 'REMOTE') {
        return 'Error while deleting from Internxt Drive'
      } else {
        return ''
      }
    }
  },
  filters: {
    showOnlyFilename(name) {
      return path.parse(name).base
    }
  }
}
</script>
