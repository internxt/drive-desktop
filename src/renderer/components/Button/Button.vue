<template>
  <button
    class="border-gray-200 tracking-wide text-sm"
    :class="{
      'bg-white': isDefault,
      'bg-gray-200': isActive,
      'bg-blue-600': isAccent,
      'bg-blue-800': isAccentActive,
      'text-white': !disabled && (isAccent || isAccentActive),
      'text-blue-400': disabled && (isAccent || isAccentActive),
      'text-gray-800': !disabled && (isDefault || isActive),
      'text-gray-300': disabled && (isDefault || isActive)
    }"
    :style="`border-width: 1px; border-radius: 8px; padding: 4px 12px; cursor: ${disabled ? 'default' : 'pointer'} !important;`"
    @click.stop="$emit('click')"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script>
export default {
  props: { state: {type: String, default: 'default'}, disabled: {type: Boolean, default: false} },
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