<template>
  <backups-list @close="showList = false" v-if="showList" :backupsBucket="backupsBucket" />
  <div v-else>
    <Checkbox
      :forceStatus="backupsEnabled ? 'checked' : 'unchecked'"
      @click.native="backupsEnabled = !backupsEnabled"
      label="Back up your folder and files"
    />
    <Button class="mt-2" @click="showList = true"
      >Select folders to backup</Button
    >
    <div class="flex items-center mt-3">
      <Button state="accent">Backup now</Button>

      <p class="text-sm text-gray-500 ml-3">Updated 23 minutes ago</p>
    </div>
    <p class="mt-3 text-sm text-gray-500">Upload frequency</p>
    <div class="dropdown mt-2">
      <button
        class="bg-white border border-gray-400 rounded-md text-sm"
        style="padding-left: 10px"
        type="button"
        data-toggle="dropdown"
        aria-haspopup="true"
        aria-expanded="false"
      >
        {{ humanifyInterval(currentInterval) }}
        <UilAngleDown
          class="inline bg-blue-600 text-white rounded-tr-md rounded-br-md"
          style="margin-left: 5px"
          size="25px"
        />
      </button>
      <div class="dropdown-menu">
        <a
          v-for="interval in intervalOptions"
          class="dropdown-item text-sm"
          :key="interval"
          @click="currentInterval = interval"
          >{{ humanifyInterval(interval) }}</a
        >
      </div>
    </div>
  </div>
</template>

<script>
import Checkbox from '../Icons/Checkbox.vue'
import Button from '../Button/Button.vue'
import {
  UilAngleDown
} from '@iconscout/vue-unicons'
import {updateBackupsOfDevice, getDeviceByMac} from '../../../backup-process/service'
import ConfigStore from '../../../main/config-store'
import BackupsList from './BackupsList.vue'

export default {
  components: {
    Checkbox,
    Button,
    UilAngleDown,
    BackupsList
  },
  props: ['backupsBucket'],
  data() {
    return {
      intervalOptions: [
        6 * 3600 * 1000,
        12 * 3600 * 1000,
        24 * 3600 * 1000
      ],
      currentInterval: ConfigStore.get('backupInterval'),
      backupsEnabled: ConfigStore.get('backupsEnabled'),
      showList: false
    }
  },
  methods: {
    humanifyInterval(interval) {
      switch (interval) {
        case 6 * 3600 * 1000:
          return 'Every 6 hours'
        case 12 * 3600 * 1000:
          return 'Every 12 hours'
        case 24 * 3600 * 1000:
          return 'Every day'
        default:
          return null
      }
    }
  },
  watch: {
    backupsEnabled(val) {
      ConfigStore.set('backupsEnabled', val)
    },
    async currentInterval(val) {
      ConfigStore.set('backupInterval', val)

      const device = await getDeviceByMac()
      updateBackupsOfDevice(device.id, {interval: val})
    }
  }

}
</script>