<template>
  <div
    class="absolute right-0 top-0 py-2 px-3 text-gray-600 hover:text-white hover:bg-red-600"
    @click="$emit('click')"
    style="-webkit-app-region: no-drag"
  >
    <UilMultiply />
  </div>
</template>

<script>
import { UilMultiply } from '@iconscout/vue-unicons'

export default {
  components: {
    UilMultiply
  }
}
</script>
