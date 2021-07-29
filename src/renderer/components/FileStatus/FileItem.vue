<template>
  <div class="fileLoggerItem flex w-full p-2 px-4 items-center" :status="status">
    <FileIcon :icon="fileType" class="mr-3 itemIcon" style="width:40px" width="40" height="40"/>
    <div class="flex flex-col">
      <div class="text-base itemName">{{ name }}</div>
      <div class="text-sm itemInfo">{{ info }}</div>
    </div>
  </div>
</template>

<style>
  .fileLoggerItem[status="error"] .itemInfo {
    color: #DA1E28;
  }
  .fileLoggerItem[status="downloaded"] .itemInfo, .fileLoggerItem[status="uploaded"] .itemInfo {
    color: #198038;
  }
  .fileLoggerItem[status="downloading"], .fileLoggerItem[status="uploading"], .fileLoggerItem[status="encrypting"] {
    opacity: .5;
  }
</style>

<script>
import FileIcon from '../Icons/FileIcon.vue'

export default {
  props: {
    fileType: {
      type: String,
      default: 'file'
    },
    name: {
      type: String,
      default: 'Unknow name'
    },
    info: {
      type: String,
      default: 'No info'
    },
    status: {
      type: String,
      default: 'undefined'
    }
  },
  components: {
    FileIcon
  }
}
</script>