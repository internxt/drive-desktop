<template>
<div>
  <h1>Add new backup</h1>
  <div class="flex items-center mt-2">
    <div class="flex items-center">
      <div @click="selectFolder"><UilFolderOpen class="text-blue-600 mr-2 mt-0.5 cursor-pointer" /></div>
      <p class="text-xs text-gray-500 break-words w-72">{{ this.path }}</p>
    </div>
    <div v-if="this.path" @click="create" class="text-sm text-blue-600 ml-8 cursor-pointer">
      Accept
    </div>
  </div>
</div>
</template>

<script>
import fs from 'fs'
import {
  UilFolderOpen
} from '@iconscout/vue-unicons'
import {createBackup} from '../../../backup-process/service'

const remote = require('@electron/remote')

export default {
  components: {UilFolderOpen},
  props: ['backupsBucketId'],
  data() {
    return (
      {
        path: ''
      }
    )
  },
  methods: {
    async create() {
      await createBackup(this.path, this.backupsBucketId)

      this.$emit('backupCreated')
      this.path = ''
    },
    selectFolder() {
      const newDir = remote.dialog.showOpenDialogSync({
        properties: ['openDirectory']
      })
      if (newDir && newDir.length > 0 && fs.existsSync(newDir[0])) {
        this.path = newDir[0]
      }
    }
  }
}
</script>