<template>
  <div class="bg-white rounded-t-2xl p-4 px-6 h-48 fileStatusBox overflow-scroll">
      <!-- {{this.statusFile()}} -->
      {{ this.AllfilesShow() }}
    <div v-if="FileStatusSync.length > 0">
      <div class="text-base text-black font-bold mb-3">File status</div>
      <div class="mb-1">
        <div
          class=""
          v-for="(item, index) in FileStatusSync"
          v-bind:key="index"
        >
          <div class="flex mb-2" v-if="item.progress < 100">
            <UilFileUpload class="text-2xl mr-3 fill-current text-gray-300" />
            <div>
              <div>{{ item.filename }}</div>
              <div class="text-xs text-gray-500">
                <span class="text-green-500">{{ formatNumberPercent(item.progress) }} %</span>
                Synchronizing file upload
              </div>
            </div>
          </div>
          <div v-if="item.progress >= 100">
            <div class="flex mb-2" v-if="item.state === 'success' || !item.state">
              <UilFileCheckAlt
                class="text-2xl mr-3 fill-current text-green-500"
              />
              <div>
                <div v-if="item.filename.length < 30">{{ item.filename }}</div>
                <div v-if="item.filename.length >= 30">{{ item.filename.substr(0,30) }}...</div>
                <div class="text-xs text-gray-500">
                  <span class="text-green-500">{{ formatNumberPercent(item.progress) }} %</span> File
                  successfully synchronized
                </div>
              </div>
            </div>

            <div class="flex mb-2" v-if="item.state === 'error'">
              <UilFileExclamation
                class="text-2xl mr-3 fill-current text-red-500"
              />
              <div>
                <div>{{ item.filename }}</div>
                <div class="text-xs text-gray-500">
                  <span class="text-red-500">0%</span> Error
                  file upload. Try again
                </div>
              </div>
            </div>

            <!-- <div class="flex mb-2" v-if="!item.state">
              <UilFileUpload class="text-2xl mr-3 fill-current text-blue-400" />
              <div>
                <div>{{ item.filename }}</div>
                <div class="text-xs text-gray-500">
                  <span class="text-red-500">{{ formatNumberPercent(item.progress) }} %</span> Start
                  Synchronizing file...
                </div>
              </div>
            </div> -->

          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center w-full h-full">
      <CircleWithCloud :width="65" :height="65"/>
      <p class="text-base text-gray-500 font-semibold mt-3">There are no files to synchronize yet</p>
    </div>
  </div>
</template>
<script>
import {
  UilFileCheckAlt,
  UilFileUpload,
  UilFileExclamation,
  UilFileBlank
} from '@iconscout/vue-unicons'
import FileLogger from '../../logic/FileLogger'
import './FileStatus'
import CircleWithCloud from '../ExportIcons/CircleWithCloud'
import ConfigStore from '../../../main/config-store'

const { app } = require('@electron/remote')
// const remote = require('@electron/remote')

// FileLogger.on('update-last-entry', (item) => console.log('LAST-ENTRY', item))
// FileLogger.on('update-last-entry',(item) => console.log('HERE', item))
FileLogger.on('update-last-entry', (item) =>
  console.log('update-last-entry', FileLogger.getAll)
)

export default {
  data() {
    return {
      test: {},
      FileStatusSync: [],
      loading: false
    }
  },
  created() {
    // console.log('Entrar')
    // this.AllfilesShow()
  },
  mounted: function () {
    // console.log('Montado')
  },
  updated: function () {
    console.log('LOG', ConfigStore.get('stopSync'), ConfigStore.get('isSyncing'))
    // app.on('sync-off')
    // console.log('Actualizado')
    this.AllfilesShow()
  },
  destroyed: function () {
    // console.log('destroy')
  },
  methods: {
    formatNumberPercent(value) {
      var formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0
      })
      return formatter.format(value)
    },
    statusFile() {
      FileLogger.on('update-last-entry', (item) => {
        const newArray = [item, ...this.FileStatusSync]
        this.FileStatusSync = newArray
        return this.FileStatusSync
      })
      return console.log('DATA', this.FileStatusSync)
    },
    AllfilesShow() {
      FileLogger.on('new-emit', (item) => {
        // console.log('organizar', item)
        this.FileStatusSync = item
        return this.FileStatusSync
      })
      return console.log('new-emit', this.FileStatusSync)
    }
  },
  name: 'FileStatus',
  props: {},
  components: {
    UilFileCheckAlt,
    UilFileUpload,
    UilFileExclamation,
    UilFileBlank,
    CircleWithCloud
  }
}
</script>
