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
    <UilHistory class="text-gray-500 relative" size="22px" />
    <UilCheckCircle v-if="state === 'success'" class="text-green-500 absolute" style="bottom:-2; right:-2" size="15px" />
    <UilSync v-if="state === 'in-progress'" class="text-blue-500 absolute" style="bottom:-2; right:-2" size="15px" />
    <UilExclamationCircle v-if="state === 'warn' || state === 'error'" :class="{'text-yellow-400' : state === 'warn', 'text-red-500' : state === 'error'}" class="absolute" style="bottom:-2; right:-2" size="15px" />
  </div>
</template>

<script>
import {
  UilHistory,
  UilCheckCircle,
  UilSync,
  UilExclamationCircle
} from '@iconscout/vue-unicons'
export default {
  props: ['state'],
  components: {
    UilHistory,
    UilCheckCircle,
    UilSync,
    UilExclamationCircle
  }
}
</script>