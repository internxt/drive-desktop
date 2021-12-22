<template>
  <div>
    <div class="flex justify-between self-center p-3">
      <div class="flex flex-col">
        <div class="flex items-center">
          <div class="text-xs">
            <div>{{ emailAccount }}</div>
            <div class="flex" v-if="showUsage">
              <div class="mr-0.5 text-gray-500 text-xs">
                <span :class="{ 'text-red-600': showUsageWarning }">{{
                  usage
                }}</span>
                of {{ limit }}
              </div>
              <div
                v-if="showUpgrade"
                class="ml-1 text-blue-60 cursor-pointer text-xs"
                @click="openLinkBilling"
              >
                Upgrade
              </div>
            </div>
            <content-placeholders
              v-else
              class="h-5 pt-1"
              :rounded="true"
              style="margin-bottom: -4px;"
            >
              <content-placeholders-text :lines="1" />
            </content-placeholders>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-center">
        <!-- {{ this.$data.localPath }} -->
        <div
          v-tooltip="{
            content: 'Open drive web',
            placement: 'bottom',
            delay: { show: 750, hide: 50 }
          }"
          class="header-item cursor-pointer"
          @click="goToDriveWeb"
        >
          <UilGlobe class="text-gray-500" size="20px" />
        </div>
        <div
          class="flex items-center justify-center cursor-pointer header-item"
          @click="openFolder"
          v-tooltip="{
            content: 'Open sync folder',
            placement: 'bottom',
            delay: { show: 750, hide: 50 }
          }"
        >
          <UilFolderOpen class="text-gray-500" size="20px" />
        </div>
        <div
          class="
            flex
            items-center
            justify-center
            cursor-pointer
            header-item
            dropdown-toggle
            dropdown"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          <div class="relative">
            <UilSetting
              class="text-gray-500 "
              style="outline: none"
              size="20px"
              v-tooltip="{
                content: 'Settings',
                placement: 'bottom',
                delay: { show: 750, hide: 50 }
              }"
            />
            <div
              v-if="numberOfSyncIssues > 0"
              style="height:7px;width:7px;right:1px;top:1px;"
              class="bg-red-600 rounded-full absolute"
            ></div>
          </div>

          <div
            class="dropdown-menu rounded-lg text-sm text-gray-600"
            data-offset="0,10"
          >
            <a
              class="dropdown-item"
              @click="() => openSettingsWindow('general')"
              >Preferences</a
            >
            <div
              v-if="numberOfSyncIssues > 0"
              class="dropdown-item flex items-center justify-between"
              @click="openSyncIssuesWindow"
            >
              <div>Sync Issues</div>
              <div class="text-red-600 text-xs font-semibold">
                {{ numberOfSyncIssues }}
              </div>
            </div>
            <a class="dropdown-item" @click="ContactSupportMailto">Support</a>
            <a class="dropdown-item pb-2" @click="logout">Log out</a>
            <a class="dropdown-item pb-2" @click="openOnboarding()">Show Onboarding</a>
            <a
              class="dropdown-item border-gray-100 border-t border-solid pt-2"
              @click="quitApp"
              >Quit</a
            >
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showUsageWarning"
      class="px-3 py-2 flex items-center text-xs border-yellow-100 border-b bg-yellow-50 text-yellow-600"
    >
      <img
        style="width: 20px; height:20px"
        src="../../assets/icons/apple/warn.svg"
      />
      <p class="ml-2 mb-0">Running out of space</p>
      <p
        @click="openLinkBilling"
        class="flex-grow underline cursor-pointer flex justify-end items-center mb-0"
      >
        Upgrade now
      </p>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import './Header.scss'
import {
  UilFolderNetwork,
  UilSetting,
  UilUserCircle,
  UilMultiply,
  UilFolderOpen,
  UilServerConnection,
  UilFileTimes,
  UilSlidersVAlt,
  UilHistory,
  UilGlobe
} from '@iconscout/vue-unicons'
import InternxtBrand from '../ExportIcons/InternxtBrand'
import analytics from '../../logic/utils/analytics'
import VToolTip from 'v-tooltip'
import bytes from 'bytes'
import FileIcon from '../Icons/FileIcon.vue'
import Checkbox from '../Icons/Checkbox.vue'
import Avatar from '../Avatar/Avatar.vue'
import * as Auth from '../../../main/auth'
import ConfigStore from '../../../main/config-store'
import electron, { ipcRenderer } from 'electron'
Vue.use(VToolTip)
const remote = require('@electron/remote')

export default {
  data() {
    return {
      isProduction: process.env.NODE_ENV === 'production',
      usage: '',
      limit: '',
      showUsage: false,
      showUpgrade: false,
      numberOfSyncIssues: 0
    }
  },
  beforeDestroy() {
    remote.app.removeAllListeners('update-storage')
    remote.app.removeAllListeners('logout-entrypoint')
    remote.app.removeListener('sync-issues-changed', this.setNumberOfSyncIssues)
  },
  created() {
    this.$app = this.$electron.remote.app
    // Storage and space used
    remote.app.on('update-storage', data => {
      this.usage = data.usage
      this.limit = data.limit
      if (this.usage && this.limit) {
        this.showUpgrade = bytes.parse(this.limit) < 2199023255552
        this.showUsage = true
      }
    })

    remote.app.on('logout-entrypoint', this.logout)

    ipcRenderer.invoke('getSyncIssues').then(this.setNumberOfSyncIssues)

    remote.app.on('sync-issues-changed', this.setNumberOfSyncIssues)
  },
  methods: {
    openLinkBilling() {
      analytics.trackUpgradeButton()
      remote.shell.openExternal('https://drive.internxt.com/storage')
    },
    openSettingsWindow(section = 'general') {
      ipcRenderer.send('open-settings-window', section)
    },
    // Contact support
    ContactSupportMailto() {
      if (process.platform === 'linux') {
        remote.app.emit('show-info', 'email: hello@internxt.com')
      } else {
        remote.shell.openExternal(
          `mailto:hello@internxt.com?subject=Support Ticket&body=If you want to upload log files to our tech teams. Please, find them on the Open Logs option in the menu.`
        )
      }
    },
    quitApp() {
      analytics.trackQuit()
      remote.app.emit('app-close')
    },
    onLogoutClick() {
      this.$store.originalDispatch('showSettingsDialog', {
        title: 'Log out',
        description: 'Are you sure?',
        answers: [{ text: 'Cancel' }, { text: 'Log out', state: 'accent' }],
        callback: userResponse => {
          if (userResponse === 1) {
            this.logout()
          }
        }
      })
    },
    logout() {
      Auth.logout()
      this.$router.push('/')
    },
    openOnboarding() {
      ipcRenderer.send('open-onboarding')
    },
    openFolder() {
      electron.shell.openPath(ConfigStore.get('syncRoot'))
    },
    goToDriveWeb() {
      remote.shell.openExternal('https://drive.internxt.com')
    },
    setNumberOfSyncIssues(syncIssues) {
      this.numberOfSyncIssues =
        syncIssues && syncIssues.length ? syncIssues.length : 0
    },
    openSyncIssuesWindow() {
      ipcRenderer.send('open-sync-issues-window')
    }
  },
  name: 'Header',
  props: {
    appName: {
      type: String,
      default: 'Internxt'
    },
    emailAccount: {
      type: String,
      default: 'Aplication'
    },
    IconClass: {
      type: String,
      default: ''
    },
    userFullname: {
      type: String,
      default: ''
    }
  },
  components: {
    UilSetting,
    UilUserCircle,
    UilFolderNetwork,
    InternxtBrand,
    UilMultiply,
    UilHistory,
    UilFolderOpen,
    UilServerConnection,
    UilFileTimes,
    UilSlidersVAlt,
    FileIcon,
    Checkbox,
    Avatar,
    UilGlobe
  },
  computed: {
    showUsageWarning() {
      if (this.usage === '' || this.limit === '') {
        return false
      }

      const usageInBytes = bytes.parse(this.usage)
      const limitInBytes = bytes.parse(this.limit)

      if (usageInBytes === null || limitInBytes === null) return false

      return usageInBytes / limitInBytes >= 0.9
    }
  }
}
</script>

<style>
.header-item {
  padding: 6px;
  border-radius: 0.5rem;
}
.header-item:hover {
  background-color: #f4f5f7;
}
.header-item:active {
  background-color: #ebecf0;
}

.dropdown::after {
  display: none;
}

.dropdown-item:active {
  background-color: #ebecf0;
  color: initial !important;
}

.dropdown-item:hover {
  background-color: #f4f5f7;
}
</style>
