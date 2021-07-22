<template>
<div>

  <div class="flex justify-between fixed bg-white p-2 px-6 w-full">
      <div class="text-base text-black font-bold">Activity</div>
      <div>
        <div v-if="this.isSyncing" class="text-gray-300 text-sm cursor-not-allowed hover:text-gray-300">Clear</div>
        <div v-else @click="clearFileLogger()" class="text-blue-600 text-sm cursor-pointer hover:text-blue-800">Clear</div>
      </div>

    </div>

  <div
    class="bg-white rounded-t-2xl p-4 px-6 h-56 fileStatusBox overflow-scroll"
  >
    <div v-if="this.FileStatusSync.length > 0" class="mt-7">
      <div class="mb-1 mt-4">
        <div
          class=""
          v-for="(item, index) in FileStatusSync"
          v-bind:key="index"
        >
          <!-- {{ Upload in progress}} -->
          <div
            class="flex mb-2"
            v-if="!item.state && (item.action === 'upload')"
          >
            <UilFileUpload
              class="text-2xl mr-3 fill-current text-gray-500"
            />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                {{ item.progress ? item.progress + '%' : '' }} File uploading
              </div>
            </div>
          </div>
          <!-- {{ En progreso encrypt entra aquí }} -->
          <div
            class="flex mb-2"
            v-if="item.state == null && (item.action === 'encrypt')"
          >
            <UilFileUpload
              class="text-2xl mr-3 fill-current text-gray-500"
            />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                Encrypting File
              </div>
            </div>
          </div>
          <!-- {{ En progreso download entra aquí }} -->
          <div
            class="flex mb-2"
            v-if="!item.state && item.action === 'download'"
          >
            <UilFileDownload class="text-2xl mr-3 fill-current text-gray-500" />

            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                {{ item.progress ? item.progress + '%' : '' }} File downloaded
              </div>
            </div>
          </div>

          <!-- {{ Upload success }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'success' && item.action === 'upload'"
          >
            <UilFileCheckAlt
              class="text-2xl mr-3 fill-current text-green-500"
            />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                File uploaded
              </div>
            </div>
          </div>

          <!-- {{ Download success }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'success' && item.action === 'download'"
          >
            <UilFileDownload
              class="text-2xl mr-3 fill-current text-green-500"
            />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                File downloaded
              </div>
            </div>
          </div>

          <!-- {{ Download Error }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'error' && item.action === 'download'"
          >
            <UilFileExclamation
              class="text-2xl mr-3 fill-current text-red-500"
            />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                <div class="text-red-500">
                  Error downloading file.
                </div>
              </div>
            </div>
          </div>

          <!-- {{ Upload Error }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'error' && item.action === 'upload'"
          >
            <UilFileExclamation
              class="text-2xl mr-3 fill-current text-red-500"
            />
            <div>
              <div>{{ item.filename }}</div>
              <div class="text-xs text-gray-500">
                <div class="text-red-500">Error uploading file.</div>
              </div>
            </div>
          </div>

          <!-- {{ Remove Error }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'error' && item.action === 'remove'"
          >
            <UilTrashAlt class="text-2xl mr-3 fill-current text-red-500" />
            <div>
              <div class="text-gray-500">
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                <div class="text-red-500">Error deleting file on the internxt cloud.</div>
              </div>
            </div>
          </div>

          <!-- {{ Remove Sccess }} -->
          <div
            class="flex mb-2"
            v-if="item.state === 'success' && item.action === 'remove'"
          >
            <UilTrashAlt class="text-2xl mr-3 fill-current text-gray-500" />
            <div>
              <div>
                {{ item.filename }}
              </div>
              <div class="text-xs text-gray-500">
                <div class="text-green-500">File removed from the Internxt cloud</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
  </div>
</template>
<script>
import {
  UilFileCheckAlt,
  UilFileUpload,
  UilFileExclamation,
  UilFileBlank,
  UilFileTimes,
  UilFileDownload,
  UilTrashAlt
} from '@iconscout/vue-unicons'
import './FileStatus'
import CircleWithCloud from '../ExportIcons/CircleWithCloud'
import ConfigStore from '../../../main/config-store'
import FileLogger from '../../logic/FileLogger'

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
    UilFileCheckAlt,
    UilFileUpload,
    UilFileExclamation,
    UilFileBlank,
    CircleWithCloud,
    UilFileTimes,
    UilFileDownload,
    UilTrashAlt
  }
}
</script>
