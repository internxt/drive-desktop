<template>
  <div class="relative flex flex-col h-full" style="background-color: #fafbfc;">
    <div
      class="relative px-1 pt-1 h-6 flex-grow-0"
      style="-webkit-app-region: drag; "
    >
      <exit-window-button v-if="!isMacOS" @click="closeWindow" />
      <p
        class="text-sm text-gray-700"
        style="position:absolute;top:4px;left:50%; transform: translateX(-50%);"
      >
        Sync issues
      </p>
    </div>
    <div
      class="flex justify-between items-center pt-4 pr-3 pl-4 flex-grow-0"
      style="-webkit-app-region: drag"
    >
      <div class="font-bold text-gray-700 tracking-wide text-sm">
        {{ syncIssues.length ? `${syncIssues.length} issues` : 'No issues' }}
      </div>
      <div
        class=" text-gray-600 rounded-md py-1 font-semibold cursor-pointer"
        style="font-size: 12px; -webkit-app-region: no-drag; padding: 4px 11px; background-color: #ebecf0"
        @click="openLogs"
      >
        Open log
      </div>
    </div>
    <div class="m-3 flex-grow rounded-md" style="border: 1px solid #ebecf0">
      <div
        v-if="syncIssues.length === 0"
        class="flex justify-center items-center text-gray-400 text-sm h-full"
      >
        No issues found
      </div>
      <div v-for="type in issueTypes" :key="type">
        <div
          v-if="issuesOfType(type).length > 0"
          class="hover:bg-gray-100 rounded-md cursor-pointer p-2"
          @click="() => onIssueClicked(type)"
        >
          <div class="flex items-center justify-between ">
            <div class="flex items-center">
              <img class="w-9 h-9" :src="warnIcon" />
              <div class="ml-2">
                <h2 class="text-sm tracking-wide font-semibold text-gray-600">
                  {{ displayNameOfType(type) }}
                </h2>
                <p class="text-sm tracking-wide text-gray-500">
                  {{ issuesOfType(type).length + ' ' }}files
                </p>
              </div>
            </div>
            <div
              class="transform transition-all"
              :class="{
                'rotate-180': expanded === type,
                'rotate-0': expanded !== type
              }"
            >
              <UilAngleDown />
            </div>
          </div>
          <div v-if="expanded === type">
            <div
              class="ml-11 flex items-center mt-2"
              v-for="issue in issuesOfType(type)"
              :key="issue.name"
            >
              <file-icon />
              <p class="text-sm text-gray-700 ml-2">{{ issue.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  UilSetting,
  UilAt,
  UilHistory,
  UilAngleDown
} from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import warnIcon from '../assets/icons/apple/warn.svg'
import FileIcon from '../components/Icons/FileIcon.vue'
import ExitWindowButton from './ExitWindowButton/ExitWindowButton.vue'

import { ipcRenderer } from 'electron'
import Logger from '../../libs/logger'
import path from 'path'
import electronLog from 'electron-log'
const remote = require('@electron/remote')

export default {
  components: {
    Button,
    UilSetting,
    UilAt,
    UilHistory,
    UilAngleDown,
    FileIcon,
    ExitWindowButton
  },
  data() {
    return {
      issueTypes: [
        'NOT_EXISTS',
        'NO_PERMISSION',
        'NO_INTERNET',
        'NO_REMOTE_CONNECTION',
        'BAD_RESPONSE',
        'UNKNOWN'
      ],
      syncIssues: [],
      expanded: null,
      warnIcon
    }
  },
  mounted() {
    ipcRenderer.invoke('getSyncIssues').then(this.setSyncIssues)

    remote.app.on('sync-issues-changed', this.setSyncIssues)
  },
  beforeDestroy() {
    remote.app.removeListener('sync-issues-changed', this.setSyncIssues)
  },
  methods: {
    closeWindow() {
      remote.app.emit('close-sync-issues-window')
    },
    setSyncIssues(newValue) {
      this.syncIssues = newValue
    },
    issuesOfType(type) {
      return this.syncIssues.filter(issue => issue.errorName === type)
    },
    displayNameOfType(type) {
      switch (type) {
        case 'NOT_EXISTS':
          return 'File does not exist'
        case 'NO_PERMISSION':
          return 'Insufficient permissions'
        case 'NO_INTERNET':
          return 'No internet connection'
        case 'NO_REMOTE_CONNECTION':
          return "Can't connect to Internxt servers"
        case 'BAD_RESPONSE':
          return 'Bad response from Internxt servers'
        default:
          return 'Unknown error'
      }
    },
    onIssueClicked(type) {
      this.expanded = this.expanded === type ? null : type
    },
    openLogs() {
      try {
        const logFile = electronLog.transports.file.getFile().path
        const logPath = path.dirname(logFile)
        remote.shell.openPath(logPath)
      } catch (e) {
        Logger.error('Error opening log path: %s', e.message)
      }
    }
  },
  computed: {
    isMacOS() {
      return process.platform === 'darwin'
    }
  }
}
</script>
