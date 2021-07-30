<template>
  <div class="fileItem flex w-full p-2 px-4 items-center" :status="status" @click="openFilePath(filePath)">
    <FileIcon :icon="fileType" class="mr-3 itemIcon" style="width:40px" width="40" height="40"/>
    <div class="flex w-full flex-col itemTag">
      <div class="text-base itemName">{{ name }}</div>
      <div class="text-sm itemInfo" style="margin-top:-6px;">{{ info }}</div>
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
import electron from 'electron'

export default {
  props: {
    fileObject: {
      type: Object
    },
    fileType: {
      type: String,
      default: 'file'
    },
    filePath: {
      type: String,
      default: ''
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
  methods: {
    openFilePath (filePath) {
      if (this.filePath && (this.status === 'encrypting' || this.status === 'uploading' || this.status === 'uploaded' || this.status === 'downloaded')) electron.shell.showItemInFolder(filePath) // showItemInFolder or openPath
    },
    printObject (obj) {
      console.table(obj)
    }
  },
  components: {
    FileIcon
  }
}
</script>