<template>
	<div class="h-full pb-28">
		<div v-if="!user">Loading...</div>
		<div class="h-full" v-else>
      <div v-if="user.backupsBucket" class="flex flex-col justify-between h-full">
        <backups-list @backupRemoved="fetchBackups" :backupsBucketId="user.backupsBucket" :backups="backups"/>
        <create-backup @backupCreated="fetchBackups" :backupsBucketId="user.backupsBucket"/>
      </div>
      <div v-else class="flex justify-center my-10">
			  <button @click="activateBackups" class="bg-gray-200 rounded text-blue-900 px-5 py-2">Activate</button>
      </div>
		</div>
	</div>
</template>

<script>
import Auth from '../../logic/utils/Auth'
import macaddress from 'macaddress'
import os from 'os'
import CreateBackup from './CreateBackup.vue'
import BackupsList from './BackupsList.vue'
import {fetchUsersBackupBucket, getAllBackups} from '../../../backup-process/service'

export default {
  components: {CreateBackup, BackupsList},
  data() {
    return {
      user: null,
      backups: []
    }
  },
  async mounted() {
    await this.fetchUser()
    if (this.user && this.user.backupsBucket) { this.fetchBackups() }
  },
  methods: {
    async fetchUser() {
      this.user = await fetchUsersBackupBucket()
    },
    async fetchBackups() {
      this.backups = await getAllBackups()
    },
    async activateBackups() {
      const headers = await Auth.getAuthHeader()
      await fetch(`${process.env.API_URL}/api/backup/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          deviceId: await macaddress.one(),
          deviceName: os.hostname()
        })
      })
      Auth.saveHeadersInConfigStore()
      this.fetchUser()
    }
  }

}
</script>