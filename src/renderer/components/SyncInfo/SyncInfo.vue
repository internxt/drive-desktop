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
      <div
        v-for="item in items"
        :key="item.name"
        class="flex items-center w-full"
      >
        <file-icon-with-operation
          :operation="getOperation(item)"
          size="32"
          class="flex-shrink-0 flex-grow-0"
        />
        <div class="ml-2 flex-shrink flex-grow">
          <p class="text-sm truncate mt-1">
            {{ item.name | showOnlyFilename }}
          </p>
          <p class="text-xs text-gray-600">{{ getStatusMessage(item) }}</p>
        </div>
        <UilInfoCircle
          v-if="isAnError(item)"
          size="20px"
          class=" text-blue-500 cursor-pointer hover:opacity-60 flex-shrink-0 flex-grow-0"
          @click.native="openSyncIssuesWindow"
        />
      </div>
    </div>
    <div
      v-if="items.length === 0"
      class="h-full flex flex-col items-center justify-center text-center"
    >
      <div class="relative w-full h-20">
        <div
          class="absolute transform rotate-12 left-1/2 -translate-x-6 opacity-60"
        >
          <file-icon-with-operation :size="70" />
        </div>
        <div class="absolute transform -rotate-12 left-1/2 -translate-x-10">
          <file-icon-with-operation :size="70" />
        </div>
      </div>
      <p class="mt-7 text-sm text-gray-600">There is no recent activity</p>
      <p class="mt-1 text-xs text-gray-400 px-4">
        Information will show up here when changes are made to sync your local
        folder with Internxt Drive
      </p>
    </div>
  </div>
</template>

<script>
import { UilFolder, UilCloud, UilInfoCircle } from '@iconscout/vue-unicons'
import path from 'path'
import FileIconWithOperation from '../Icons/FileIconWithOperation.vue'
import { shortMessages } from '../../../sync/sync-error-messages'
import { ipcRenderer } from 'electron'
const app = require('@electron/remote').app

export default {
  components: {
    UilFolder,
    UilCloud,
    UilInfoCircle,
    FileIconWithOperation
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
          'DELETE_ERROR',
          'METADATA_READ_ERROR'
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
    onNext() {
      this.items = []
    },
    clear() {},
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
      } else if (item.action === 'PULL_ERROR') {
        return shortMessages[item.errorName]
      } else if (item.action === 'DELETE' && item.kind === 'LOCAL') {
        return `Deleting from your computer`
      } else if (item.action === 'DELETE' && item.kind === 'REMOTE') {
        return `Deleting from Internxt Drive`
      } else if (item.action === 'DELETED' && item.kind === 'LOCAL') {
        return `Deleted from your computer`
      } else if (item.action === 'DELETED' && item.kind === 'REMOTE') {
        return `Deleted from Internxt Drive`
      } else if (item.action === 'DELETE_ERROR') {
        return shortMessages[item.errorName]
      } else if (item.action === 'METADATA_READ_ERROR') {
        return shortMessages[item.errorName]
      } else {
        return ''
      }
    },
    getOperation(item) {
      if (
        item.action === 'DELETE' ||
        item.action === 'DELETED' ||
        item.action === 'DELETE_ERROR'
      ) {
        return 'delete'
      } else if (
        item.action === 'PULL' ||
        item.action === 'PULLED' ||
        item.action === 'PULL_ERROR'
      ) {
        if (item.kind === 'LOCAL') {
          return 'download'
        } else {
          return 'upload'
        }
      } else {
        return ''
      }
    },
    openSyncIssuesWindow() {
      ipcRenderer.send('open-sync-issues-window')
    },
    isAnError(item) {
      return ['PULL_ERROR', 'DELETE_ERROR', 'METADATA_READ_ERROR'].includes(
        item.action
      )
    }
  },
  filters: {
    showOnlyFilename(name) {
      return path.parse(name).base
    }
  }
}
</script>
