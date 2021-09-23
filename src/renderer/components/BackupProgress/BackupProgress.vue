<template>
  <div>
    <div style="border-width:1px;" class="bg-blue-50 rounded-xl border-blue-100 flex items-stretch">
      <div class="p-2 flex-grow flex items-center">
        <UilSync class="text-blue-60 animate-spin"/>
        <p class="text-xs ml-2 text-gray-700">Backup uploading {{progress.currentBackupIndex + 1}} of {{progress.totalBackupsCount}}</p>
      </div>
      <div class="flex flex-col justify-center items-center text-gray-400 hover:bg-blue-100 hover:text-blue-600 rounded-tr-xl rounded-br-xl" style="font-size: 10px;">
      <p @click="stopBackup" class="px-2" >Stop backup</p>
</div>
    </div>
  </div>	
</template>

<script>
import {UilSync} from '@iconscout/vue-unicons'
import {ipcRenderer} from 'electron'
const remote = require('@electron/remote')

export default {
  props: ['progress'],
  components: {UilSync},
  methods: {
    async stopBackup() {
      const {response} = await remote.dialog.showMessageBox(remote.getCurrentWindow(),
        { type: 'question', buttons: ['Confirm', 'Cancel'], defaultId: 1, cancelId: 1, title: 'Confirm backup stop', message: 'Are you sure that you want to stop the ongoing backup process?' })

      if (response === 0) { ipcRenderer.send('stop-backup-process') }
    }
  }
}
</script>