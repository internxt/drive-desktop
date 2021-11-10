<template>
  <div>
    <new-sync v-if="showNewSync" @cancel="showNewSync = false" @finish="e => {showNewSync = false; addItem(e);}"/>
    <div v-else @click.stop="selectedItem = null">
      <p class="text-sm">Folders you want to keep in sync</p>
      <div
      class="
        h-44
        mt-3
        border border-gray-200
        bg-white
        rounded-md
        overflow-y-auto
      "
      >
        <div
          v-for="(item, i) in items"
          :key="`${item.folderId}${item.localPath}`"
          :class="{
            'bg-gray-50': i % 2 != 0 && selectedItem !== item,
            'bg-blue-600 text-white': selectedItem === item,
          }"
          class="flex flex-col px-2 py-1 max-w-full"
          @click.stop="selectedItem = item"
        >
          <div class="flex items-center w-full">
            <img :src="FolderIcon" style="margin-right: 6px" class="flex-shrink-0 w-4 h-4" />
            <p class="truncate text-sm">{{ item.localPath }}</p>
          </div>
          <UilArrowsV/>
          <div class="flex items-center w-full">
            <img :src="FolderIcon" style="margin-right: 6px" class="flex-shrink-0 w-4 h-4" />
            <p class="truncate text-sm">{{ item.remotePath }}</p>
          </div>
        </div>
        <div class="flex w-full h-full justify-center items-center text-gray-400" v-if="items.length === 0">No sync folders yet</div>
      </div>
      <div class="flex items-center space-x-1 mt-3">
        <Button @click="showNewSync = true">
          <div class="flex items-center">
            <UilPlus class="inline" size="18px" />
          </div>
        </Button>
        <Button :state="selectedItem ? 'default' : 'default-disabled'" @click="deleteSelected">
          <div class="flex items-center">
            <UilMinus class="inline" size="18px" />
          </div>
        </Button>
      </div>
    </div>
  </div>	
</template>

<script>
import {
  UilPlus,
  UilMinus,
  UilArrowsV
} from '@iconscout/vue-unicons'
import Button from '../Button/Button.vue'
import NewSync from './NewSync.vue'
import SyncDB from '../../../sync/sync-db'
import FolderIcon from '../../assets/icons/apple/folder.svg'

export default {
  components: {
    UilPlus,
    UilMinus,
    UilArrowsV,
    Button,
    NewSync
  },
  data() {
    return {
      loading: false,
      items: [],
      showNewSync: false,
      selectedItem: null,
      FolderIcon
    }
  },
  mounted() {
    this.fetch()
  },
  methods: {
    async addItem(item) {
      await SyncDB.insert(item)
      await this.fetch()
    },
    async fetch () {
      this.loading = true
      this.items = await SyncDB.get()
      this.loading = false
    },
    async deleteSelected() {
      if (this.selectedItem) {
        await SyncDB.disableOne(this.selectedItem)
        await this.fetch()
        this.selectedItem = null
      }
    }
  }
}
</script>