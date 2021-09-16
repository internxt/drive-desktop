<template>
  <div
    @click="$emit('click')"
    class="
      flex flex-col
      items-center
      px-3
      py-2
      rounded-xl
      tracking-wider
      cursor-pointer
    "
    :class="{
      'text-gray-400 hover:text-gray-500': !active,
      'text-blue-600': active,
      'bg-blue-50': active,
    }"
  >
    <component :is="icon" size="27px" />
    <p class="font-semibold text-xs">{{ title }}</p>
  </div>
</template>

<script>
export default {
  props: ['title', 'active', 'icon']
}
</script>