<template>
  <div class="h-full">
    <div
      v-if="status === 'TO_ACTIVATE'"
      class="mt-10 text-center flex flex-col items-center"
    >
      <p class="w-72">
        Save a copy of your most important files on the cloud automatically
      </p>
      <Button class="mt-3" @click="activateBackups">Start using backup</Button>
    </div>
    <div
      v-else-if="status === 'LOADING'"
      class="h-full flex items-center justify-center"
    >
      <p>Loading...</p>
    </div>
    <backups-panel v-else :backupsBucket="backupsBucket" :backupStatus="backupStatus" />
  </div>
</template>

<script>
import {fetchUsersBackupBucket} from '../../../backup-process/service'
import Button from '../../components/Button/Button.vue'
import Auth from '../../logic/utils/Auth'
import BackupsPanel from './BackupsPanel.vue'
import ConfigStore from '../../../main/config-store'

export default {
  components: {Button, BackupsPanel},
  name: 'BackupsSection',
  props: ['backupStatus'],
  data() {
    return {
      status: 'LOADING',
      backupsBucket: null
    }
  },
  mounted() {
    this.setBackupStatus()
  },
  methods: {
    async activateBackups() {
      this.status = 'LOADING'
      const headers = await Auth.getAuthHeader()
      await fetch(`${process.env.API_URL}/api/backup/activate`, {
        method: 'POST',
        headers
      })
      await ConfigStore.set('backupsEnabled', true)
      this.setBackupStatus()
    },
    async setBackupStatus() {
      const userData = await fetchUsersBackupBucket()
      if (userData.backupsBucket) { this.status = 'ACTIVATED'; this.backupsBucket = userData.backupsBucket } else { this.status = 'TO_ACTIVATE' }
    }
  }
}
</script>