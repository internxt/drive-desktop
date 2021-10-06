<template>
  <div class="px-3 py-2 flex items-center text-xs border-yellow-100 border-b" :class="{'bg-yellow-50 text-yellow-600': backupStatus === 'WARN', 'bg-red-50 text-red-600': backupStatus === 'FATAL', 'hidden': !['WARN', 'FATAL'].includes(backupStatus)}">
    <img v-if="backupStatus === 'WARN'" style="width: 20px; height:20px" src="../../assets/icons/apple/warn.svg"/>
    <img v-else style="width: 20px; height:20px" src="../../assets/icons/apple/error.svg"/>
    <p class="ml-2">Some folders could not be uploaded</p>
    <p @click="$emit('actionClick')" class="flex-grow underline cursor-pointer flex justify-end items-center">View details</p>
  </div>
</template>

<script>
export default {
  props: ['backupStatus']
}
</script>