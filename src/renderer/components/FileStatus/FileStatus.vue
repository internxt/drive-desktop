<template>
  <div class="overflow-hidden fileLogger">
    <div v-if="false" class="flex">
      <div @click="loadFileLogger()" class="ml-3 cursor-pointer">Load log</div>
      <div @click="loadQueueLog()" class="ml-3 cursor-pointer">Queue log</div>
      <div @click="saveFileLogger()" class="ml-3 cursor-pointer">Save log</div>
    </div>
    <div v-if="this.FileStatusSync.length > 0" class="clearLog top-0 right-0 z-10">
        <div v-if="this.isSyncing" class="button disabled">Clear</div>
        <div v-else @click="clearFileLogger()" class="button">Clear</div>
    </div>
    <div class="overflow-auto overflow-x-hidden pb-3">
      <!-- Test for future time stamps -->
      <!-- (⚠️) Header modals (Settings, Sync and Devtools) z-index and top become unstable (⚠️) -->
      <!--
      <div class="timeStampGroup">
        <div class="timeStamp sticky top-0 px-5 py-3">Today</div>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name large'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name very large'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name with many words in the name field'" :info="'File uploaded'" status='uploaded'/>
        <FileItem fileType="" :filePath="''" :name="'Test name'" :info="'File uploaded'" status='uploaded'/>
      </div>
      <div class="timeStampGroup">
        <div class="timeStamp sticky top-0 px-5 py-3">Yesterday</div>
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
        <div class="timeStamp sticky top-0 px-5 py-3">This week</div>
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

      <div v-if="this.FileStatusSync.length > 0">
        <div v-for="(item, index) in FileStatusSync" v-bind:key="index">
          <!-- Debug --> <!--<FileItem :name="'File debugger'" :info="'Click to print debug info'" status='debug'/>-->
          <!-- Uploading -->  <FileItem v-if="!item.state && (item.action === 'upload')" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Uploading... ' + (item.progress ? Math.trunc(item.progress) + '%' : '')" status='uploading'/>
          <!-- Encrypting --> <FileItem v-if="item.action === 'encrypt'" fileType="" :filePath="item.filePath" :name="item.filename" info="Encrypting..." status='encrypting'/>
          <!-- Download --> <FileItem v-if="!item.state && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Downloading... ' + (item.progress ? Math.trunc(item.progress) + '%' : '')" status='downloading'/>
          <!-- Upload success --> <FileItem v-if="item.state === 'success' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="File uploaded" status='uploaded'/>
          <!-- Download success --> <FileItem v-if="item.state === 'success' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="File downloaded" status='downloaded'/>
          <!-- Download Error --> <FileItem v-if="item.state === 'error' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error downloading file" status='error'/>
          <!-- Upload Error --> <FileItem v-if="item.state === 'error' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error uploading file" status='error'/>
          <!-- Remove Error --> <FileItem v-if="item.state === 'error' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error deleting file on the internxt cloud" status='error'/>
          <!-- Remove Success --> <FileItem v-if="item.state === 'success' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="File removed" status='removed'/>
        </div>
      </div>
      <div v-else class="emptyState flex flex-col items-center justify-center">
        <div class="icon flex-none">
          <FileIcon class="iconBack" icon="file" width="100px" height="100px"/>
          <FileIcon class="iconFront" icon="file" width="100px" height="100px"/>
        </div>
        <div class="msgTitle">There is no recent activity</div>
        <div class="msgDescription">Sync information will show up here when you add or<br>remove a file from your local Internxt Drive folder</div>
      </div>
    </div>
  </div>
</template>

<script>
import FileItem from './FileItem.vue'
import FileIcon from '../Icons/FileIcon.vue'
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
  updated: function () {
    console.log(this.FileStatusSync)
  },
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
    loadFileLogger() {
      FileLogger.loadLog()
    },
    loadQueueLog() {
      console.log(FileLogger.getQueue())
    },
    saveFileLogger() {
      FileLogger.saveLog()
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
    },
    dateUpdated(givenDate) {
      console.log(`%c item : : ${this.givenDate}`, 'color: #8A3FFC')
      console.log(`%c dateUpdated() : item.date: ${this.givenDate.date}`, 'color: #8A3FFC')

      var date = new Date()
      var today = new Date(date.getFullYear(), date.getMonth() - 1, date.getDay() - 1) // Today
      var yesterday = new Date(date.getFullYear(), date.getMonth() - 1, date.getDay() - 2) // Yesterday
      var aWeekAgo = new Date(date.getFullYear(), date.getMonth() - 1, date.getDay() - 8) // A week ago

      givenDate.setHours(0)
      givenDate.setMinutes(0)
      givenDate.setSeconds(0, 0)

      if (today.getTime() === givenDate.getTime()) {
        console.log()
        return 'today'
      } else if (yesterday.getTime() === givenDate.getTime()) {
        return 'yesterday'
      } else if (aWeekAgo.getTime() < givenDate.getTime()) {
        return 'thisWeek'
      }
      return 'old'
    }
  },
  name: 'FileStatus',
  components: {
    FileItem,
    FileIcon
  }
}
</script>
