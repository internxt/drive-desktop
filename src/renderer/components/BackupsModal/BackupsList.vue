<template>
<div >
  <div v-for="backup in backups" class="flex items-center justify-between mt-2" :key="backup.id">
    <div class="flex flex-col">
      <p class="text-gray-500 break-words mr-5">{{ backup.path }}</p>
      <p class="text-gray-500 text-xs break-words w-72">Interval: {{ backup.interval }} ms</p>
      <p class="text-gray-500 text-xs break-words w-72">{{ backup.fileId ? `Last backup made at: ${backup.updatedAt}` : 'Never saved'}}</p>
    </div>
    <div class="text-sm text-red-900 cursor-pointer" @click="() => deleteOne(backup.id)">
			Delete
    </div>
  </div>
</div>
</template>

<script>
import {
  UilFolderOpen
} from '@iconscout/vue-unicons'
import {deleteBackup} from '../../../backup-process/service'

export default {
  components: {UilFolderOpen},
  props: ['backupsBucketId', 'backups'],
  methods: {
    async deleteOne(id) {
      await deleteBackup(id)
      this.$emit('backupRemoved')
    }
  }
}
</script>