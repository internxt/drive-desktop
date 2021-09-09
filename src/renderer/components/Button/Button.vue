<template>
  <button
    class="border-gray-200 text-gray-800 tracking-wider"
    :class="{
      'bg-gray-200': isActive,
      'bg-blue-600': isAccent,
      'bg-blue-800': isAccentActive,
      'text-white': isAccent || isAccentActive,
    }"
    style="border-width: 1px; border-radius: 8px; padding: 4px 12px"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script>
export default {
  props: { state: {type: String, default: 'default'} },
  computed: {
    isDefault() {
      return this.state === 'default'
    },
    isActive() {
      return this.state === 'active'
    },
    isAccent() {
      return this.state === 'accent'
    },
    isAccentActive() {
      return this.state === 'accentActive'
    }
  }
}
</script>