<template>
  <div
    class="bg-white rounded-t-2xl p-4 px-6 h-52 fileStatusBox overflow-scroll"
  >
    <div class="flex justify-between">
      <div class="text-base text-black font-bold">Activity</div>
      <div>
        <div @click="clearFileLogger()" class="text-blue-600 text-sm cursor-pointer hover:text-blue-800">Clear</div>
      </div>

    </div>

    <div v-if="this.FileStatusSync.length > 0">
      <div class="mb-1 mt-4">
        <div
          class=""
          v-for="(item, index) in FileStatusSync"
          v-bind:key="index"
        >
          <!-- {{ En progreso upload entra aquí }} -->
          <div
            class="flex mb-2"
            v-if="item.state == null && (item.action === 'upload')"
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
                File successfully downloaded
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
                <div class="text-green-500">File removed from the internxt cloud</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center w-full h-full">
      <div class="text-gray-600 text-sm">To start synchronizing press on play button</div>
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
      test: {},
      loading: false,
      stopSync: ConfigStore.get('stopSync')
    }
  },
  props: {
    FileStatusSync: {
      type: Array,
      required: false
    }
  },
  created() {},
  beforeDestroy: function () {},
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
