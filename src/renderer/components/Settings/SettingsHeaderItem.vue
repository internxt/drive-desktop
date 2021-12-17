<template>
  <div
    @click="$emit('click')"
    style="-webkit-app-region: no-drag"
    class="
      flex flex-col
      items-center
      px-3
      py-2
      rounded-xl
      tracking-wider
      cursor-pointer
      w-20 
      settings-header-item"
    :class="{
      'text-gray-400 hover:text-gray-500': !active,
      'text-blue-600': active,
      'bg-blue-50': active
    }"
  >
    <slot />
    <p class="font-semibold text-xs">{{ title }}</p>
  </div>
</template>

<script>
export default {
  props: ['title', 'active']
}
</script>

<style scoped>
.settings-header-item:active {
  background: #f4f5f7;
}
</style>
