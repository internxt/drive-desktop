<template>
  <!-- <div class="close-button">
    <button @click="closeApp()">
      <img src="~@/../resources/icons/close.png" />
    </button>
  </div> -->

  <main class="w-full h-full flex flex-col justify-center bg-white px-12">
    <div class="flex flex-row items-center">
      <InternxtBrand :width="20" :height="20"/>
      <span class="text-xl text-black font-bold ml-2">{{ showTwoFactor ? 'Security Verification' : 'Sign in to Internxt Drive' }}</span>
    </div>

    <form class="mt-8 bg-white relative"
      id="form"
      @submit="handleFormSubmit"
    >
      <input
        class="w-full h-10 focus:outline-none mb-3 border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="email"
        type="text"
        placeholder="Email address"
      />
      <input
        class="w-full h-10 focus:outline-none border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="password"
        :type="visibility"
        placeholder="Password"
      />

      <!-- Shows the password -->
      <div v-if="visibility === 'password'" @click="showPassword()" class="absolute right-6 -mt-7 cursor-pointer">
        <Eye />
      </div>

      <!-- Hides the password -->
      <div v-if="visibility === 'text'" @click="hidePassword()" class="absolute right-6 -mt-7 cursor-pointer">
        <CrossEye />
      </div>
      <!-- <transition
        enter-class="enter"
        enter-to-class="enter-to"
        enter-active-class="slide-enter-active"
        leave-class="leave"
        leave-to-class="leave-to"
        leave-active-class="slide-leave-active"
      > -->
        <div v-if="errors.length" class="mt-2 -mb-4">
          <p v-if="errors.length > 1" class="text-sm text-black font-bold">There have been errors</p>
          <p v-else class="text-sm text-black font-bold">There has been an error</p>

          <ul class="list-disc ml-6">
            <li v-for="error in errors" :key="error">
              {{ console.log(error) }}
            </li>
          </ul>
        </div>

      <!-- </transition> -->

      <div class="flex flex-row relative">
        <div v-if="isLoading" class="absolute bottom-2.5 left-24 ml-2.5">
          <Spinner class="animate-spin z-10" />
        </div>
        <input
          class="w-full text-white font-bold mt-8 py-2.5 text-sm rounded focus:outline-none cursor-pointer bg-blue-500"
          type="submit"
          value="Sign in"
        />
      </div>

    </form>

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
import Spinner from '../components/ExportIcons/Spinner'
import Eye from '../components/ExportIcons/eye'
import CrossEye from '../components/ExportIcons/cross-eye'
const remote = require('@electron/remote')
const ROOT_FOLDER_NAME = 'Internxt Drive'
const HOME_FOLDER_PATH = remote.app.getPath('home')
const anonymousId = uuid4()

export default {
  name: 'login-page',
  beforeCreate() {
    remote.app.emit('window-show')
  },
  created() {
    // console.log('NEW WINDOW')
    const { BrowserWindow } = remote
  },
  data() {
    return {
      email: '',
      password: '',
      showTwoFactor: false,
      twoFactorCode: '',
      isLoading: false,
      DRIVE_BASE: config.DRIVE_BASE,
      version: packageConfig.version,
      errors: [],
      visibility: 'password'
    }
  },
  components: {
    InternxtBrand,
    Spinner,
    Eye,
    CrossEye
  },
  methods: {
    showPassword() {
      this.visibility = 'text'
    },
    hidePassword() {
      this.visibility = 'password'
    },
    handleFormSubmit(e) {
      e.preventDefault()
      this.errors = []

      if (!this.email) this.errors.push('The email must not be empty')
      if (!this.password) this.errors.push('The password must not be empty')

      if (!this.errors.length && !this.isLoading) {
        this.doLogin()
      }
    },
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
    /* checkForm() {
      // console.log('isLoading:', this.$data.isLoading, 'username:', this.$data.username, 'pass:', this.$data.password)
      if (this.$data.isLoading) {
        return true
      }
      // console.log(this.$data.username && this.$data.password ? 'true' : 'false')
      if (this.$data.username && this.$data.password) {
        return false
      }

      return true
    } */
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
        body: JSON.stringify({ email: this.email })
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
                properties: {
                  status: res.res.status,
                  msg: res.body.error
                }
              })
              .catch(err => {
                Logger.error(err)
              })
            console.log('res =>', res.body)
            if (res.body.error) {
              return this.errors.push(res.body.error)
            }
            return this.errors.push('There was an error while logging in')
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
          this.errors.push(err)
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
          email: this.email,
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
                properties: {
                  status: res.data.status,
                  msg: res.data.error
                }
              })
              .catch(err => {
                Logger.error(err)
              })
            if (res.data.error) {
              this.errors.push(res.data.error)
              if (res.data.error.includes('Wrong email')) {
                this.$data.twoFactorCode = ''
                this.$data.showTwoFactor = false
              }
            } else {
              this.errors.push('There was an error while logging in')
            }
          } else {
            res.data.user.email = this.email.toLowerCase()
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
                email: 'email'
              })
              .then(() => {
                analytics.track({
                  userId: undefined,
                  event: 'user-signin',
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
