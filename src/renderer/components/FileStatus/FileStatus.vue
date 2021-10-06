<template>
  <div class="overflow-hidden fileLogger">
    <div v-if="false" class="flex">
      <div @click="loadFileLogger()" class="ml-3 cursor-pointer">Load log</div>
      <div @click="loadQueueLog()" class="ml-3 cursor-pointer">Queue log</div>
      <div @click="saveFileLogger()" class="ml-3 cursor-pointer">Save log</div>
    </div>
    <div class="overflow-auto overflow-x-hidden">

      <div v-if="backupProgress">
        <div class="timeStamp px-3 py-3 sticky top-0">Backups</div>
        <FileItem fileType="backup" :filePath="backupProgress.currentBackup.path" :name="basename(backupProgress.currentBackup.path)" :info="`Backing up... ${backupProgress.currentBackupProgress !== null ? `(${backupProgress.currentBackupProgress}%)` : ''}`" />
      </div>
      <div v-if="this.FileStatusSync.length > 0" class="clearLog top-0 right-0 z-10">
          <div v-if="!this.isSyncing" @click="clearFileLogger()" class="button">Clear</div>
      </div>
      <div v-for="group in timestampGroups" :key="group.name">

        <div v-if="group.items.length > 0" class="timeStampGroup">
          <div class="timeStamp sticky top-0 px-3 py-3">{{group.name}}</div>
          <div v-for="(item, index) in group.items" :key="index">
            <FileItem v-if="!item.state && item.progress && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Uploading... ' + (item.progress ? Math.trunc(item.progress) + '%' : '')" status='uploading'/>
            <FileItem v-if="item.action === 'encrypt'" fileType="" :filePath="item.filePath" :name="item.filename" info="Encrypting..." status='encrypting'/>
            <FileItem v-if="!item.state && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" :info="'Downloading... ' + (item.progress ? Math.trunc(item.progress) + '%' : '')" status='downloading'/>
            <FileItem v-if="item.state === 'success' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="File uploaded" status='uploaded'/>
            <FileItem v-if="item.state === 'success' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="File downloaded" status='downloaded'/>
            <FileItem v-if="item.state === 'error' && item.action === 'download'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error downloading file" status='error'/>
            <FileItem v-if="item.state === 'error' && item.action === 'upload'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error uploading file" status='error'/>
            <FileItem v-if="item.state === 'error' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="Error deleting file on the internxt cloud" status='error'/>
            <FileItem v-if="item.state === 'success' && item.action === 'remove'" fileType="" :filePath="item.filePath" :name="item.filename" info="File removed" status='removed'/>
          </div>
        </div>

      </div>

      <div v-if="this.FileStatusSync.length <= 0 && !backupProgress" class="emptyState flex flex-col items-center justify-center">
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
import {basename} from 'path'
import './FileStatus.scss'

const remote = require('@electron/remote')

export default {
  data() {
    return {
      isSyncing: ConfigStore.get('isSyncing'),
      basename
    }
  },
  created: function() {
    remote.app.on('sync-on', this.changeIsSyncing)
    remote.app.on('sync-off', this.changeIsSyncing)
    remote.app.on('sync-stop', this.changeIsSyncing)
  },
  props: ['FileStatusSync', 'backupProgress'],
  beforeDestroy: function () {
    remote.app.removeListener('sync-off', this.changeIsSyncing)
    remote.app.removeListener('sync-on', this.changeIsSyncing)
    remote.app.removeListener('sync-stop', this.changeIsSyncing)
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
      FileLogger.eraseQueue()
      FileLogger.eraseLog()
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
    dateStamp(thisTimeStamp) {
      /*
      * Returns FileStatusSync filtered by thisTimeStamp
      */

      var today = new Date()
      today.setHours(0)
      today.setMinutes(0)
      today.setSeconds(0, 0)

      var yesterday = new Date()
      yesterday.setDate(today.getDate() - 1)
      yesterday.setHours(0)
      yesterday.setMinutes(0)
      yesterday.setSeconds(0, 0)

      var thisWeek = new Date()
      thisWeek.setDate(today.getDate() - 7)
      thisWeek.setHours(0)
      thisWeek.setMinutes(0)
      thisWeek.setSeconds(0, 0)

      var activityLog = []

      if (thisTimeStamp === 'today') {
        activityLog = this.FileStatusSync.filter(item => today.getTime() === this.getDayInMili(item.date))
      } else if (thisTimeStamp === 'yesterday') {
        activityLog = this.FileStatusSync.filter(item => yesterday.getTime() === this.getDayInMili(item.date))
      } else if (thisTimeStamp === 'thisWeek') {
        activityLog = this.FileStatusSync.filter(item => thisWeek.getTime() <= this.getDayInMili(item.date) && yesterday.getTime() > this.getDayInMili(item.date))
      } else if (thisTimeStamp === 'old') {
        activityLog = this.FileStatusSync.filter(item => thisWeek.getTime() > this.getDayInMili(item.date))
      } else {
        console.warn('Error filtering filelogger log: date must be now or earlier, item date is future')
      }

      return activityLog
    },
    getDayInMili(date) {
      // Cleans all Hour, Minute, Seconds and Milisecond data and only leaves Year, Month and Day in Miliseconds
      var result = new Date(date)
      result.setHours(0)
      result.setMinutes(0)
      result.setSeconds(0, 0)
      return result.getTime()
    }
  },
  computed: {
    timestampGroups() {
      return [
        {
          name: 'Today',
          items: this.dateStamp('today')
        },
        {
          name: 'Yesterday',
          items: this.dateStamp('yesterday')
        },
        {
          name: 'A week ago',
          items: this.dateStamp('thisWeek')
        },
        {
          name: 'Older',
          items: this.dateStamp('old')
        }
      ]
    }
  },
  name: 'FileStatus',
  components: {
    FileItem,
    FileIcon
  }
}
</script>
