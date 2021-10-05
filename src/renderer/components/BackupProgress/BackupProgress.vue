<template>
  <div>
    <div style="border-width:1px;" class="bg-blue-50 rounded-xl border-blue-100 flex items-stretch">
      <div class="p-2 flex-grow flex items-center">
        <UilSync class="text-blue-60 animate-spin"/>
        <p class="text-xs ml-2 mb-0 text-gray-700">Backup uploading {{progress.currentBackupIndex + 1}} of {{progress.totalBackupsCount}}</p>
      </div>
      <div class="flex flex-col justify-center items-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 rounded-tr-xl rounded-br-xl" style="font-size: 10px;">
        <p @click="stopBackup" class="px-2 mb-0" >Stop backup</p>
      </div>
    </div>
  </div>	
</template>

<script>
import {UilSync} from '@iconscout/vue-unicons'
import {ipcRenderer} from 'electron'

export default {
  props: ['progress'],
  components: {UilSync},
  methods: {
    async stopBackup() {
      this.$store.originalDispatch('showSettingsDialog', {
        title: 'Stop ongoing backup',
        description: 'Are you sure that you want to stop the ongoing backup process?',
        answers: [
          {text: 'Cancel'},
          {text: 'Stop backup', state: 'red'}
        ],
        callback: (response) => {
          if (response === 1) { ipcRenderer.send('stop-backup-process') }
        }
      })
    }
  }
}
</script>