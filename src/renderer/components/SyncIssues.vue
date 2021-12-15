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
        class=" text-gray-600 rounded-md py-1 font-semibold cursor-pointer open-logs-button"
        style="font-size: 12px; -webkit-app-region: no-drag; padding: 4px 11px;"
        @click="openLogs"
      >
        Open log
      </div>
    </div>
    <div
      class="m-3 flex-grow rounded-md overflow-y-auto"
      style="border: 1px solid #ebecf0"
    >
      <div
        v-if="syncIssues.length === 0"
        class="flex justify-center items-center text-gray-400 text-sm h-full"
      >
        No issues found
      </div>
      <div v-for="(type, i) in issueTypes" :key="type">
        <div
          v-if="issuesOfType(type).length > 0"
          class="rounded-md cursor-pointer p-2 sync-issue"
          :class="{ 'odd-sync-issue': i % 2 !== 0 }"
          @click="() => onIssueClicked(type)"
        >
          <div class="flex items-center justify-between ">
            <div class="flex items-center">
              <img class="w-9 h-9" :src="warnIcon" />
              <div class="ml-2">
                <div class="flex items-center">
                  <h2 class="text-sm tracking-wide font-semibold text-gray-600">
                    {{ displayNameOfType(type) }}
                  </h2>
                  <UilInfoCircle
                    size="15px"
                    class="ml-1 block h-4 text-blue-500 cursor-pointer hover:opacity-60"
                    style="margin-top:3px"
                    @click.native.stop="moreInfoType = type"
                  />
                </div>
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
    <div
      class="min-h-full min-w-full top-0 left-0 absolute z-50 flex justify-center items-center"
      style="background-color: rgba(0,0,0,0.3)"
      @click.self="hideMoreInfo"
      v-if="moreInfoType !== null"
    >
      <div
        style="border-radius: 8px"
        class="bg-white p-3 flex flex-col justify-between w-11/12"
      >
        <h1 class="font-semibold text-gray-800 tracking-wide">
          {{ displayNameOfType(moreInfoType) }}
        </h1>
        <p v-if="!report" class="text-xs text-gray-500 mt-2">
          {{ displayLongMessageOfType(moreInfoType) }}
        </p>
        <p v-else class="text-xs text-gray-500 mt-2">
          To get help visit
          <span class="text-blue-500 underline cursor-pointer" @click="goToHelp"
            >help.internxt.com</span
          >. You can also send a report about this error.
        </p>
        <div v-if="report">
          <p class="mt-2 text-xs text-gray-500">Comments</p>
          <textarea
            v-model="userComment"
            class="w-full mt-1 text-xs outline-none border-gray-100 border p-1 rounded-md text-gray-800 h-16"
            style="resize:none;caret-color: rgba(31, 41, 55, 0.6)"
          />
          <div class="flex items-center mt-2 cursor-pointer">
            <input type="checkbox" v-model="sendLogsWithReport" />
            <p class="text-xs ml-1 text-gray-500">
              Include the logs of this sync process for debug purposes
            </p>
          </div>
        </div>
        <div
          class="flex items-center justify-between"
          :class="{ 'mt-2': report, 'mt-6': !report }"
        >
          <p
            class="text-xs text-red-600"
            :class="{ 'opacity-0': !report || reportState !== 'ERROR' }"
          >
            An error happened while sending your report
          </p>
          <div class="flex items-center justify-end space-x-2">
            <Button v-if="!report" @click="hideMoreInfo"> Close</Button>
            <Button v-else @click="report = false"> Cancel</Button>
            <Button v-if="!report" @click="report = true" state="accent">
              Report</Button
            >
            <Button
              v-else-if="report && reportState !== 'LOADING'"
              @click="sendReport"
              state="accent"
              >Send</Button
            >
            <UilSpinnerAlt
              v-else-if="report && reportState === 'LOADING'"
              class="z-10 text-gray-500 animate-spin"
              style="width: 58px"
              size="22px"
            />
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
  UilAngleDown,
  UilInfoCircle,
  UilSpinnerAlt
} from '@iconscout/vue-unicons'
import Button from './Button/Button.vue'
import warnIcon from '../assets/icons/apple/warn.svg'
import FileIcon from '../components/Icons/FileIcon.vue'
import ExitWindowButton from './ExitWindowButton/ExitWindowButton.vue'
import { longMessages, shortMessages } from '../../sync/sync-error-messages'

import { ipcRenderer } from 'electron'
import Logger from '../../libs/logger'
import { reportBug } from '../logic/bug-report'
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
    ExitWindowButton,
    UilInfoCircle,
    UilSpinnerAlt
  },
  data() {
    return {
      issueTypes: [
        'NOT_EXISTS',
        'NO_PERMISSION',
        'NO_INTERNET',
        'NO_REMOTE_CONNECTION',
        'BAD_RESPONSE',
        'EMPTY_FILE',
        'UNKNOWN'
      ],
      syncIssues: [],
      expanded: null,
      warnIcon,
      moreInfoType: null,
      report: false,
      sendLogsWithReport: true,
      reportState: null,
      userComment: ''
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
      return shortMessages[type] || shortMessages['UNKNOWN']
    },
    displayLongMessageOfType(type) {
      return longMessages[type] || longMessages['UNKNOWN']
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
    },
    hideMoreInfo() {
      this.moreInfoType = null
      this.userComment = ''
      this.report = false
      this.reportState = null
    },
    async sendReport() {
      try {
        const issueOfSelectedType = this.syncIssues.find(
          issue => issue.errorName === this.moreInfoType
        )
        if (issueOfSelectedType) {
          this.reportState = 'LOADING'
          await reportBug(
            issueOfSelectedType.errorDetails,
            this.userComment,
            this.sendLogsWithReport
          )
        }
        this.hideMoreInfo()
      } catch (err) {
        Logger.error('Error while sending a bug report', err)
        this.reportState = 'ERROR'
      }
    },
    goToHelp() {
      remote.shell.openExternal('https://help.internxt.com')
    }
  },
  computed: {
    isMacOS() {
      return process.platform === 'darwin'
    }
  }
}
</script>

<style>
.open-logs-button {
  background-color: #ebecf0;
}
.open-logs-button:active {
  background-color: #cdcdd1;
}

.odd-sync-issue {
  background-color: #f4f4f579;
}
.sync-issue:hover {
  background-color: #f5f5f5cc;
}
.sync-issue:active {
  background-color: #eeecec93;
}
</style>
