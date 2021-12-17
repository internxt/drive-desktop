<template>
  <div class="relative">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 32H26C27.1046 32 28 31.1046 28 30V8L20 0H6C4.89543 0 4 0.895431 4 2V30C4 31.1046 4.89543 32 6 32Z"
        fill="#EBECF0"
      />
      <path
        d="M22.4849 7.21213L28 8L20 0L20.7879 5.51508C20.9136 6.39503 21.605 7.08642 22.4849 7.21213Z"
        fill="#B3BAC5"
      />
    </svg>
    <div class="absolute text-blue-500 left-1/2 top-1/2">
      <UilArrowDown :size="operationIconSize" v-if="operation === 'download'" />
      <UilArrowUp :size="operationIconSize" v-if="operation === 'upload'" />
      <UilTrash :size="operationIconSize" v-if="operation === 'delete'" />
    </div>
  </div>
</template>

<script>
import { UilArrowDown, UilArrowUp, UilTrash } from '@iconscout/vue-unicons'
export default {
  components: { UilArrowDown, UilArrowUp, UilTrash },
  props: {
    size: {
      type: String,
      default: '18'
    },
    operation: {
      type: String,
      default: ''
    }
  },
  computed: {
    operationIconSize() {
      const parsedSize = parseInt(this.size)
      return `${parsedSize / 2}px`
    }
  },
  name: 'FileIconWithOperation'
}
</script>
