<template>
  <!-- <div class="close-button">
    <button @click="closeApp()">
      <img src="~@/../resources/icons/close.png" />
    </button>
  </div> -->

  <main class="w-full h-full flex flex-col bg-white px-12 py-8">
    <div class="flex flex-row items-center">
      <InternxtBrand :width="20" :height="20"/>
      <span class="text-xl text-black font-bold ml-2">{{ showTwoFactor ? 'Security Verification' : 'Sign in to Internxt' }}</span>
    </div>

    <div class="mt-6">
      <input
        class="w-full h-10 focus:outline-none mb-3 border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="username"
        type="text"
        placeholder="Email address"
      />
      <input
        class="w-full h-10 focus:outline-none border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="password"
        type="password"
        placeholder="Password"
      />
    </div>

    <!-- TWO FACTOR NOT ACTUALLY USING IT -->
    <!-- <div v-if="showTwoFactor">
      <div>Enter your 6 digit authenticator code below</div>
      <input
        class="w-full h-10 focus:outline-none border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="twoFactorCode"
        type="text"
        placeholder="Authentication code"
      />
    </div> -->

    <input
      class="w-full h-12 text-white font-bold mt-6 py-2 text-sm bg-blue-500 rounded focus:outline-none"
      type="submit"
      :disabled="checkForm()"
      @click="doLogin()"
      value="Sign in"
    />

    <div v-if="!showTwoFactor" class="block text-xs font-bold mt-4">
      <span class="text-gray-400">Don't have an Internxt account?</span>
      <a class="text-blue-400" href="#" @click="open(`${DRIVE_BASE}/new`)">Get one for free!</a>
    </div>

    <div class="self-center mt-6 text-gray-300 text-xs">v{{ version }}</div>
  </main>
</template>

<script>
import crypt from '../logic/crypt'
import database from '../../database'
import fs from 'fs'
import Logger from '../../libs/logger'
import config from '../../config'
import path from 'path'
import packageConfig from '../../../package.json'
import analytics from '../logic/utils/analytics'
import ConfigStore from '../../main/config-store'
import uuid4 from 'uuid4'
import InternxtBrand from '../components/ExportIcons/InternxtBrand'
const remote = require('@electron/remote')
const ROOT_FOLDER_NAME = 'Internxt Drive'
const HOME_FOLDER_PATH = remote.app.getPath('home')
const anonymousId = uuid4()

export default {
  name: 'login-page',
  beforeCreate() {
    remote.app.emit('window-show')
  },
  data() {
    return {
      username: '',
      password: '',
      showTwoFactor: false,
      twoFactorCode: '',
      isLoading: false,
      DRIVE_BASE: config.DRIVE_BASE,
      version: packageConfig.version
    }
  },
  components: {
    InternxtBrand
  },
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link)
    },
    // selectFolder () {
    //   const path = remote.dialog.showOpenDialog({ properties: ['openDirectory'] })
    //   if (path && path[0]) {
    //     this.$data.storagePath = path[0]
    //   }
    // },
    isEmptyFolder(path) {
      if (!fs.existsSync(path)) {
        return true
      } else {
        const filesInFolder = fs.readdirSync(path)
        return filesInFolder.length === 0
      }
    },
    checkForm() {
      // console.log('isLoading:', this.$data.isLoading, 'username:', this.$data.username, 'pass:', this.$data.password)
      if (this.$data.isLoading) {
        return true
      }
      console.log(this.$data.username && this.$data.password ? 'true' : 'false')
      if (this.$data.username && this.$data.password) {
        return false
      }

      return true
    },
    // savePathAndLogin () {
    //   database.Set('xPath', this.$data.storagePath).then(() => {
    //     this.doLogin()
    //   }).catch(err => {
    //     this.$data.isLoading = false
    //     Logger.error(err)
    //     alert(err)
    //   })
    // },
    createRootFolder(folderName = ROOT_FOLDER_NAME, n = 0) {
      const rootFolderName = folderName + (n ? ` (${n})` : '')
      const rootFolderPath = path.join(HOME_FOLDER_PATH, rootFolderName)
      const exist = fs.existsSync(rootFolderPath)

      let isEmpty
      if (exist) {
        isEmpty = this.isEmptyFolder(rootFolderPath)
      }

      if (exist && !isEmpty) {
        return this.createRootFolder(folderName, n + 1)
      }

      if (!exist) {
        fs.mkdirSync(rootFolderPath)
      }

      return database.Set('xPath', rootFolderPath)
    },
    doLogin() {
      this.$data.isLoading = true
      fetch(`${process.env.API_URL}/api/login`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'content-type': 'application/json',
          'internxt-client': 'drive-desktop',
          'internxt-version': packageConfig.version
        },
        body: JSON.stringify({ email: this.$data.username })
      })
        .then(async res => {
          const text = await res.text()
          try {
            return { res, body: JSON.parse(text) }
          } catch (err) {
            throw new Error(err + ' data: ' + text)
          }
        })
        .then(res => {
          if (res.res.status !== 200) {
            this.$data.isLoading = false
            analytics
              .track({
                anonymousId: anonymousId,
                event: 'user-signin-attempted',
                platform: 'desktop',
                properties: {
                  status: res.res.status,
                  msg: res.body.error
                }
              })
              .catch(err => {
                Logger.error(err)
              })
            return remote.app.emit('show-error', 'Login error')
          }
          if (res.body.tfa && !this.$data.twoFactorCode) {
            this.$data.showTwoFactor = true
            this.$data.isLoading = false
          } else {
            this.doAccess(res.body.sKey)
          }
        })
        .catch(err => {
          this.$data.isLoading = false
          Logger.error(err)
        })
    },
    async doAccess(sKey) {
      const salt = crypt.decrypt(sKey)
      const pwd = crypt.hashPassword(this.$data.password, salt)
      const encryptedHash = crypt.encrypt(pwd.hash.toString())

      fetch(`${process.env.API_URL}/api/access`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'internxt-client': 'drive-desktop',
          'internxt-version': packageConfig.version
        },
        body: JSON.stringify({
          email: this.$data.username,
          password: encryptedHash,
          tfa: this.$data.twoFactorCode
        })
      })
        .then(async res => {
          const text = await res.text()
          try {
            return { res, data: JSON.parse(text) }
          } catch (err) {
            throw new Error(err + ' data: ' + text)
          }
        })
        .then(async res => {
          if (res.res.status !== 200) {
            this.$data.isLoading = false
            analytics
              .track({
                anonymousId: anonymousId,
                event: 'user-signin-attempted',
                platform: 'desktop',
                properties: {
                  status: res.data.status,
                  msg: res.data.error
                }
              })
              .catch(err => {
                Logger.error(err)
              })
            if (res.data.error) {
              remote.app.emit('show-error', 'Login error\n' + res.data.error)
              if (res.data.error.includes('Wrong email')) {
                this.$data.twoFactorCode = ''
                this.$data.showTwoFactor = false
              }
            } else {
              remote.app.emit('show-error', 'Login error')
            }
          } else {
            res.data.user.email = this.$data.username.toLowerCase()
            this.createRootFolder()
            await database.Set(
              'xMnemonic',
              crypt.decryptWithKey(res.data.user.mnemonic, this.$data.password)
            )
            await database.logIn(res.data.user.email)
            await database.Set('xUser', res.data)
            await database.compactAllDatabases()
            ConfigStore.set('stopSync', false)
            this.$router.push('/landing-page').then(() => {
              remote.app.emit('show-info', "You've securely logged into Internxt Drive. A native Internxt folder has been created on your OS with your files. You can configure additional functionalities from the Internxt tray icon.", 'Login successful')
            }).catch(() => {})
            analytics
              .identify({
                userId: undefined,
                platform: 'desktop',
                email: 'email'
              })
              .then(() => {
                analytics.track({
                  userId: undefined,
                  event: 'user-signin',
                  platform: 'desktop',
                  properties: {
                    email: undefined
                  }
                })
              })
              .catch(err => {
                Logger.error(err)
              })
          }
        })
        .catch(err => {
          Logger.error('Error login', err)
          this.$data.isLoading = false
        })
    },
    closeApp() {
      remote.getCurrentWindow().hide()
    }
  }
}
</script>
