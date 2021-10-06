<template>
  <div
    class="flex items-center justify-center cursor-pointer relative"
    @click="$emit('click')"
    v-tooltip="{
      content: 'Backups',
      placement: 'bottom',
      delay: { show: 750, hide: 50 },
    }"
  >
    <UilHistory class=" relative" :size="size" />
    <img v-if="state === 'SUCCESS'" class="backup-status-small-icon" :width="smallSize" :height="smallSize" src="../../assets/icons/apple/completed.svg"  />
    <img v-if="state === 'IN_PROGRESS'" class="backup-status-small-icon" :width="smallSize" :height="smallSize" src="../../assets/icons/apple/syncing.svg" />
    <img v-if="state === 'WARN'" class="backup-status-small-icon" :width="smallSize" :height="smallSize" src="../../assets/icons/apple/warn.svg" />
    <img v-if="state === 'FATAL'" class="backup-status-small-icon" :width="smallSize" :height="smallSize" src="../../assets/icons/apple/error.svg" />
  </div>
</template>

<script>
import {
  UilHistory
} from '@iconscout/vue-unicons'
export default {
  props: ['state', 'size'],
  components: {
    UilHistory
  },
  computed: {
    smallSize() {
      return (this.size / 1.47).toString()
    }
  }
}
</script>

<style>
.backup-status-small-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
}
</style>