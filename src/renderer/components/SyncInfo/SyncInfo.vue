<template>
	<div style="padding: .75rem" class="h-full overflow-y-auto">
		<p v-if="currentItem" class="mb-3 text-gray-500 text-sm sticky top-0 bg-gray-50">Current</p>
		<div class="flex flex-col space-y-2 mb-3" v-if="currentItem">
			<div class="flex items-center space-x-2">
				<UilFolder class="text-blue-500"/>
				<p class="text-xs">{{currentItem.localPath}}</p>
			</div>

			<div class="flex items-center space-x-2">
				<UilCloud class="text-blue-500"/>
				<p class="text-xs">{{currentItem.remotePath}}</p>
			</div>
			<p class="text-xs text-gray-400">{{currentItemStatus}}</p>
		</div>	
		<div v-if="doneItems.length" class="flex items-center justify-between mb-3 pt-2">
			<p class="text-gray-500 text-sm sticky top-0 bg-gray-50">Finalized</p>
			<p class="text-gray-500 font-bold text-xs cursor-pointer" @click="clear">Clear</p>
		</div>
		<div class="flex flex-col space-y-4">
			<div v-for="item in doneItems" class="flex flex-col space-y-2" :key="item.remotePath + item.localPath">
				<div class="flex items-center space-x-2">
					<UilFolder/>
					<p class="text-xs">{{item.localPath}}</p>
				</div>
				<div class="flex items-center space-x-2">
					<UilCloud/>
					<p class="text-xs">{{item.remotePath}}</p>
				</div>
				<p v-if="item.result.status === 'IN_SYNC'" class="text-xs text-green-700">In sync</p>
				<div v-else-if="item.result.status === 'NOT_IN_SYNC'" class="flex items-center justify-between">
					<p class="text-xs text-yellow-700">Partially in sync</p>
					<p class="text-xs text-gray-500 font-bold cursor-pointer" @click="item.seeDetails = !item.seeDetails">{{item.seeDetails ? 'Hide' : 'See'}} details</p>
				</div>
				<p v-else-if="item.result.status === 'STOPPED_BY_USER'" class="text-xs text-yellow-700">Forced to stop</p>
				<p v-else-if="item.result.status === 'FATAL_ERROR'" class="text-xs text-red-700">{{getErrorMessage(item)}}</p>
				<p v-else-if="item.result.status === 'COULD_NOT_ADQUIRE_LOCK'" class="text-xs text-yellow-700">Other device is already syncing this folder</p>
				<div v-if="item.seeDetails && item.result.diff">
					<p v-if="item.result.diff.filesNotInLocal.length" class="text-sm">Files in remote that are not in local</p>
					<p class="text-xs text-gray-600 mt-2" v-for="file in item.result.diff.filesNotInLocal" :key="file" >{{file}}</p>
					<p v-if="item.result.diff.filesNotInRemote.length" class="mt-2 text-sm">Files in local that are not in remote</p>
					<p class="text-xs text-gray-600 mt-2" v-for="file in item.result.diff.filesNotInRemote" :key="file">{{file}}</p>
					<p v-if="item.result.diff.filesWithDifferentModtime.length" class="mt-2 text-sm">Files that are different in remote and local</p>
					<p class="text-xs text-gray-600 mt-2" v-for="file in item.result.diff.filesWithDifferentModtime" :key="file">{{file}}</p>
				</div>
			</div>
		</div>
	</div>	
</template>

<script>
import {
  UilFolder,
  UilCloud
} from '@iconscout/vue-unicons'
const app = require('@electron/remote').app

export default {
  components: {
    UilFolder,
    UilCloud
  },
  data() {
    return {
      doneItems: [],
      currentItem: null
    }
  },
  mounted() {
    app.on('SYNC_INFO_UPDATE', this.onCurrentChanged)
    app.on('SYNC_NEXT', this.onNext)
  },
  beforeDestroy() {
    app.removeListener('SYNC_INFO_UPDATE', this.onCurrentChanged)
    app.removeListener('SYNC_NEXT', this.onNext)
  },
  methods: {
    onCurrentChanged(item) {
      this.removeItemFromDone(item)
      this.currentItem = item
    },
    onNext(item) {
      item.seeDetails = false
      this.removeItemFromDone(item)
      this.doneItems = [item, ...this.doneItems]
      this.currentItem = null
    },
    clear() {
      this.doneItems = []
    },
    removeItemFromDone(item) {
      this.doneItems = this.doneItems.filter(i => item.remotePath !== i.remotePath || item.localPath !== i.localPath)
    },
    getErrorMessage(item) {
      const {errorName} = item.result

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
    }
  },
  computed: {
    currentItemStatus() {
      if (!this.currentItem) { return null }

      const {action, kind, progress, name} = this.currentItem

      if (action === 'ADQUIRING_LOCK') { return 'Checking that other device is not syncing this folder' } else if (action === 'STARTING') { return 'Starting the sync process' } else if (action === 'PULL') {
        if (kind === 'REMOTE') { return `Uploading file ${name} (${(progress * 100).toFixed(2)}%)` } else { return `Downloading file ${name} (${(progress * 100).toFixed(2)}%)` }
      } else if (action === 'RENAME') { return `Renaming file ${name}` } else if (action === 'DELETE') { return `Deleting ${name} in ${kind === 'REMOTE' ? 'Internxt drive' : 'local'}` } else if (action === 'FINALIZE') { return `Finalizing` } else { return '' }
    }
  }
}
</script>