<template>
  <div
    @click="$emit('click')"
    class="
      flex flex-col
      items-center
      px-4
      py-2
      rounded-xl
      tracking-wider
      cursor-pointer
    "
    :class="{
      'text-gray-400 hover:bg-gray-100': !active,
      'text-blue-600': active,
      'bg-blue-50': active,
    }"
  >
    <component :is="icon" size="35px" />
    <p class="font-semibold">{{ title }}</p>
  </div>
</template>

<script>
export default {
  props: ['title', 'active', 'icon']
}
</script>