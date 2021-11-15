<template>
  <div>
    <div v-if="step === 1" class="h-32">
      <h1 class="text-gray-600">1. Select a local folder</h1>
      <div class="flex items-center mt-2 space-x-2">
        <div v-if="localPath" class="flex items-center">
          <img :src="FolderIcon" style="margin-right: 6px" class="flex-shrink-0 w-4 h-4" />
          <p class="text-sm">{{localPath | truncatePath}}</p>
        </div>
        <Button :state="localPath ? 'default' : 'accent'" @click="browseLocal">Browse</Button>
      </div>
    </div>
    <div v-if="step === 2">
      <div class="flex items-center justify-between">
        <h1 class="text-gray-600">2. Select a remote folder</h1>
        <Button :state="loading ? 'default-disabled' : 'default'" @click="refresh">
          Refresh
        </Button>
      </div>
      <div class="flex items-center mt-2 justify-between">
        <div class="flex items-center space-x-4">
          <Button :state="popable ? 'default' : 'default-disabled'" @click="popFolder">
            <UilArrowUp />
          </Button>
          <p class="text-gray-600">{{remotePath | truncatePath}}</p>
        </div>
        <Button :state="creatingFolder ? 'default-disabled' : 'default'" @click="createFolder">
          <UilFolderPlus />
        </Button>
      </div>
      <div
      class="
        h-44
        mt-2
        border border-gray-200
        bg-white
        rounded-md
        overflow-y-auto
      "
      >
      <content-placeholders v-if="loading" :rounded="true" class="mt-2 ml-2">
        <content-placeholders-text v-for="i in 4" :lines="1" :key="i" />
      </content-placeholders>
      <div v-else class="h-full">
        <div
          v-if="creatingFolder"
          class="flex items-center justify-between px-2 py-1 max-w-full bg-gray-50"
        >
          <div class="flex items-center overflow-hidden">
            <img :src="FolderIcon" style="margin-right: 6px" class="flex-shrink-0 w-4 h-4" />
            <input class="outline-none" @keyup.enter="onCreatingFolderBlur" @blur="onCreatingFolderBlur" v-model="newFolderName" ref="newFolderInput" type="text" />
          </div>
        </div>
        <div
          v-for="(item, i) in items"
          :key="item.id"
          :class="{
            'bg-gray-50': i % 2 != 0 && folderId != item.id,
            'bg-blue-600 text-white': folderId === item.id,
          }"
          class="flex items-center justify-between px-2 py-1 max-w-full"
          @click.stop="folderId = item.id"
          @dblclick="() => pushFolder(item)"
        >
          <div class="flex items-center overflow-hidden">
            <img :src="FolderIcon" style="margin-right: 6px" class="flex-shrink-0 w-4 h-4" />
            <p class="truncate">{{ item.name }}</p>
          </div>
        </div>

        <div class="flex w-full h-full justify-center items-center text-gray-400" v-if="items.length === 0">No folders inside</div>
      </div>
      </div>
    </div>
    <div class="flex justify-between items-center mt-2">
      <Button @click="$emit('cancel')">Cancel</Button>
      <div class="flex items-center space-x-1">
        <Button :state="canGoPrevious ? 'default' : 'default-disabled'" @click="step--">Previous</Button>
        <Button v-if="step === 1" :state="canGoNext ? 'accent' : 'accent-disabled'" @click="step++">Next</Button>
        <Button v-if="step === 2" :state="folderId ? 'accent' : 'accent-disabled'" @click="finish">Finish</Button>
      </div>
    </div>
  </div>	
</template>

<script>
import Button from '../Button/Button.vue'
import fs from 'fs'
import {getUser, getHeaders} from '../../../main/auth'
import {
  UilArrowUp,
  UilFolderPlus
} from '@iconscout/vue-unicons'
import FolderIcon from '../../assets/icons/apple/folder.svg'
import path from 'path'
import {truncatePath} from '../../../renderer/logic/utils/path'
import crypt from '../../logic/crypt'
const remote = require('@electron/remote')

export default {
  components: {Button, UilArrowUp, UilFolderPlus},
  data() {
    return {
      step: 1,
      localPath: null,
      stack: [],
      folderId: null,
      loading: false,
      items: null,
      creatingFolder: false,
      newFolderName: '',
      FolderIcon
    }
  },
  mounted() {
    const {root_folder_id: rootFolderId} = getUser()
    this.folderId = rootFolderId
    this.pushFolder({id: rootFolderId, name: ''})
  },
  methods: {
    browseLocal() {
      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory']
      })
      if (newDir && newDir.length > 0 && fs.existsSync(newDir[0])) {
        this.localPath = newDir[0]
        this.step++
      }
    },
    async fetchFolder(id) {
      this.loading = true
      const res = await fetch(
        `${process.env.API_URL}/api/storage/v2/folder/${id}`,
        { headers: getHeaders() }
      ).then(res => res.json())

      this.items = res.children

      this.loading = false
    },
    async pushFolder(folder) {
      await this.fetchFolder(folder.id)
      this.stack.push(folder)
    },
    async popFolder() {
      if (this.popable) {
        this.stack = this.stack.slice(0, this.stack.length - 1)
        const currentFolder = this.stack[this.stack.length - 1]
        await this.fetchFolder(currentFolder.id)
        this.folderId = currentFolder.id
      }
    },
    refresh() {
      const currentFolder = this.stack[this.stack.length - 1]
      this.fetchFolder(currentFolder.id)
    },
    finish() {
      const lastFolderInStack = this.stack[this.stack.length - 1]
      let finalRemotePath = this.remotePath

      if (lastFolderInStack.id !== this.folderId) {
        const selectedFolder = this.items.find(i => i.id === this.folderId)
        finalRemotePath += `${selectedFolder.name}/`
      }

      const localPath = this.localPath + path.sep

      this.$emit('finish', {folderId: this.folderId, localPath, remotePath: finalRemotePath})
    },
    createFolder() {
      this.creatingFolder = true
      this.$nextTick(() => this.$refs.newFolderInput.focus())
    },
    async onCreatingFolderBlur() {
      if (!this.creatingFolder) {
        return
      }

      this.creatingFolder = false
      this.loading = true
      const newFolderParentId = this.stack[this.stack.length - 1].id
      const newFolder = await fetch(
        `${process.env.API_URL}/api/storage/folder`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            folderName: this.newFolderName,
            parentFolderId: newFolderParentId
          })
        }
      ).then(res => res.json())
      newFolder.name = crypt.decryptName(newFolder.name, newFolderParentId)
      this.items = [newFolder, ...this.items]
      this.loading = false
      this.newFolderName = ''
    }
  },
  computed: {
    canGoNext() {
      return this.localPath
    },
    canGoPrevious() {
      return this.step > 1
    },
    remotePath() {
      return this.stack.map(i => `${i.name}/`).join('')
    },
    popable() {
      return this.stack.length > 1
    }
  },
  filters: {
    truncatePath(path) {
      return truncatePath(path, 38)
    }
  }
}
</script>