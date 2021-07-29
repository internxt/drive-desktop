<template>
  <!--
    <div class="flex justify-between fixed bg-white p-4 px-6 w-full">
    <div class="text-base text-black font-bold">Activity</div>
    <div>
      <div v-if="this.isSyncing" class="text-gray-300 text-sm cursor-pointer hover:text-gray-300">Clear</div>
      <div v-else @click="clearFileLogger()" class="text-blue-600 text-sm cursor-pointer hover:text-blue-800">Clear</div>
    </div>

  </div>
  -->
<div>
  <FileItem fileType="folder" :name="'Test folder'" info="File uploaded" status='uploaded'/>
  <FileItem fileType="" :name="'Test folder'" info="Uploading... 69%" status='uploading'/>

  <div v-if="this.FileStatusSync.length > 0">
    <div class="" v-for="(item, index) in FileStatusSync" v-bind:key="index">
      <!-- Uploading -->  <FileItem v-if="item.state === null && (item.action === 'upload')" fileType="" :name="item.filename" :info="'Uploading... '+item.progress ? item.progress + '%' : ''" status='uploading'/>
      <!-- Encrypting --> <FileItem v-if="item.state == null && (item.action === 'encrypt')" fileType="" :name="item.filename" info="Encrypting" status='encrypting'/>
      <!-- Download --> <FileItem v-if="!item.state && item.action === 'download'" fileType="" :name="item.filename" :info="'Downloading... '+item.progress ? item.progress + '%' : ''" status='downloading'/>
      <!-- Upload success --> <FileItem v-if="item.state === 'success' && item.action === 'upload'" fileType="" :name="item.filename" info="File uploaded" status='uploaded'/>
      <!-- Download success --> <FileItem v-if="item.state === 'success' && item.action === 'download'" fileType="" :name="item.filename" info="File downloaded" status='downloaded'/>
      <!-- Download Error --> <FileItem v-if="item.state === 'error' && item.action === 'download'" fileType="" :name="item.filename" info="Error downloading file" status='error'/>
      <!-- Upload Error --> <FileItem v-if="item.state === 'error' && item.action === 'upload'" fileType="" :name="item.filename" info="Error uploading file" status='error'/>
      <!-- Remove Error --> <FileItem v-if="item.state === 'error' && item.action === 'remove'" fileType="" :name="item.filename" info="Error deleting file on the internxt cloud" status='error'/>
      <!-- Remove Success --> <FileItem v-if="item.state === 'success' && item.action === 'remove'" fileType="" :name="item.filename" info="File removed" status='removed'/>
    </div>
  </div>
</div>
</template>

<script>
import FileItem from './FileItem.vue'
import ConfigStore from '../../../main/config-store'
import FileLogger from '../../logic/FileLogger'

function fileExtension(filename) {
  return (filename.match(/[^\\/]\.([^\\/.]+)$/) || [null]).pop()
}

const remote = require('@electron/remote')

export default {
  data() {
    return {
      isSyncing: ConfigStore.get('isSyncing')
    }
  },
  created: function() {
    remote.app.on('sync-on', this.changeIsSyncing)
    remote.app.on('sync-off', this.changeIsSyncing)
    remote.app.on('sync-stop', this.changeIsSyncing)
  },
  props: {
    FileStatusSync: {
      type: Array,
      required: false
    }
  },
  beforeDestroy: function () {
    remote.app.removeListener('sync-off', this.changeIsSyncing)
    remote.app.removeListener('sync-on', this.changeIsSyncing)
    remote.app.removeListener('sync-stop', this.changeIsSyncing)
  },
  mounted: function () {},
  updated: function () {},
  destroyed: function () {},
  methods: {
    formatNumberPercent(value) {
      var formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0
      })
      return formatter.format(value)
    },
    clearFileLogger() {
      FileLogger.emit('clear-log')
    },
    changeIsSyncing(state) {
      this.isSyncing = ConfigStore.get('isSyncing')
    }
  },
  name: 'FileStatus',
  components: {
    FileItem
  }
}
</script>
