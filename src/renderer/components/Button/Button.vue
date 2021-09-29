<template>
  <button
    :class="`tracking-wide text-sm whitespace-nowrap ${style} ${fluid ? 'w-full' : ''}`"
    :style="`border-width: 1px; border-radius: 8px; padding: 4px 12px; cursor: ${isDisabled ? 'default' : 'pointer'} !important;`"
    @click.stop="$emit('click')"
    :disabled="isDisabled"
  >
    <slot />
  </button>
</template>

<script>
export default {
  props: { state: {type: String, default: 'default'}, fluid: {type: Boolean, default: false} },
  computed: {
    style() {
      switch (this.state) {
        case 'default':
          return 'bg-white border-gray-200 text-gray-600'
        case 'default-active':
          return 'bg-gray-200 border-gray-200 text-gray-600'
        case 'default-disabled':
          return 'bg-white border-gray-200 text-gray-200'
        case 'accent':
          return 'bg-blue-600 text-white'
        case 'accent-active':
          return 'bg-blue-700 text-white'
        case 'accent-disabled':
          return 'bg-blue-300 text-blue-100'
        case 'red':
          return 'bg-red-600 text-white'
        case 'red-active':
          return 'bg-red-700 text-white'
        case 'red-disabled':
          return 'bg-red-300 text-red-100'
        case 'secondary':
          return 'bg-gray-300 text-gray-500'
        case 'secondary-active':
          return 'bg-gray-400 text-gray-500'
        case 'secondary-disabled':
          return 'bg-gray-200 text-gray-200'
      }
    },
    isDisabled() {
      return this.state.includes('disabled')
    }
  }
}
</script>