<template>
  <div class="overflow-hidden fileLogger">
    <div class="clearLog top-0 right-0 z-10">
        <div v-if="this.isSyncing" class="button disabled">Clear</div>
        <div v-else @click="clearFileLogger()" class="button">Clear</div>
    </div>
    <div class="overflow-auto overflow-x-hidden">
      <!-- Test for future time stamps -->
      <!-- (⚠️) Header modals (Settings, Sync and Devtools) z-index and top become unstable (⚠️) -->
      <!--
      <div class="timeStampGroup">
        <div class="timeStamp sticky top-0 px-5 py-3">Hoy</div>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name large'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name very large'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name sooooooo largeeee'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
      </div>
      <div class="timeStampGroup">
        <div class="timeStamp sticky top-0 px-5 py-3">Ayer</div>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
      </div>
      <div class="timeStampGroup">
        <div class="timeStamp sticky top-0 px-5 py-3">Hace 3 días</div>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
      </div>
      -->

      <div v-if="this.FileStatusSync.length > 0" class="overflow-x-hidden">
        <div class="overflow-x-hidden" v-for="(item, index) in FileStatusSync" v-bind:key="index">
          <!-- Debug --> <!--<FileItem :fileObject="item" :name="'File debugger'" :info="'Click to print debug info'" status='debug'/>-->
          <!-- Uploading -->  <FileItem v-if="!item.state && (item.action === 'upload')" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Uploading... ' + item.progress ? Math.trunc(item.progress) + '%' : ''" status='uploading'/>
          <!-- Encrypting --> <FileItem v-if="item.state == null && (item.action === 'encrypt')" fileType="" :filePath="item.filePath" :name="item.filename" info="Encrypting" status='encrypting'/>
          <!-- Download --> <FileItem v-if="!item.state && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Downloading... ' + item.progress ? Math.trunc(item.progress) + '%' : ''" status='downloading'/>
          <!-- Upload success --> <FileItem v-if="item.state === 'success' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="File uploaded" status='uploaded'/>
          <!-- Download success --> <FileItem v-if="item.state === 'success' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="File downloaded" status='downloaded'/>
          <!-- Download Error --> <FileItem v-if="item.state === 'error' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error downloading file" status='error'/>
          <!-- Upload Error --> <FileItem v-if="item.state === 'error' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error uploading file" status='error'/>
          <!-- Remove Error --> <FileItem v-if="item.state === 'error' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error deleting file on the internxt cloud" status='error'/>
          <!-- Remove Success --> <FileItem v-if="item.state === 'success' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="File removed" status='removed'/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FileItem from './FileItem.vue'
import ConfigStore from '../../../main/config-store'
import FileLogger from '../../logic/FileLogger'
import './FileStatus.scss'

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
    },
    fileExtension(fName) {
      // Returns file extension ("photo.png" -> "png")
      return (fName.match(/[^\\/]\.([^\\/.]+)$/) || [null]).pop()
    },
    fileType(fExtension) {
      // Returns file type ("png" -> "image", "jpg" -> "image", "mp4" -> "video")
      // To complete
      return fExtension
    }
  },
  name: 'FileStatus',
  components: {
    FileItem
  }
}
</script>
