<template>
  <main class="w-full h-full flex flex-col justify-between bg-white px-6 pb-6 relative">
    <div class="cursor-pointer absolute top-4 right-4 z-10" @click="quitApp()">
      <UilMultiply class="mr-2 text-blue-600" />
    </div>

    <div class="flex flex-col items-center justify-center relative flex-grow">
      <span class="text-xl text-black font-bold ml-2 tracking-wide">Internxt Drive</span>
      <span class="text-xs text-gray-300">v{{version}}</span>
      <div v-if="!online" style="border-radius: 8px" class="w-full flex justify-center items-center absolute p-2 mx-6 bottom-2  bg-yellow-50 text-yellow-600 font-bold text-sm"><img class="mr-2 opacity-60" src="../assets/icons/apple/no-signal.svg" width="20px" height="20px"/>No internet connection</div>
      <div v-else-if="error" style="border-radius: 8px" class="w-full flex justify-center items-center absolute p-2 mx-6 bottom-2  bg-red-50 text-red-600 font-bold text-sm">{{error}}</div>
    </div>

    <form class=" bg-white relative"
      id="form"
      @submit="handleFormSubmit"
    >
      <div v-if="!showTwoFactor" class="text-xs text-gray-500 font-bold" :class="{'text-red-600': error, 'focus-within:text-blue-500': !error, 'opacity-40': isLoading}">
        <label for="email" id="emailLabel">Email address</label>
        <input
          id="email"
          aria-labelledby="emailLabel"
          style="border-width: 1px;border-radius: 8px;"
          class="w-full h-10 focus:outline-none focus:ring-2  mb-2 border-gray-300 px-3 font-bold text-gray-700 text-base bg-gray-50"
          :class="{'ring-red-100 ring-2 border-red-600': error, 'ring-blue-300 focus:border-blue-500': !error}"
          v-model="email"
          type="email"
          tabindex="0"
          required="true"
          ref="emailInput"
        />
      </div>
      <div v-if="!showTwoFactor" class="text-xs text-gray-500 font-bold " :class="{'text-red-600': error, 'focus-within:text-blue-500': !error, 'opacity-40': isLoading}">
        <label for="password" id="passwordLabel">Password</label>
        <div class="relative">
          <input
            aria-labelledby="passwordLabel"
            style="border-width: 1px;border-radius: 8px;"
            class="w-full h-10 focus:outline-none focus:ring-2  border-gray-300 pl-3 pr-20 font-bold text-gray-700 text-base bg-gray-50" 
            :class="{'ring-red-100 ring-2 border-red-600': error, 'ring-blue-300 focus:border-blue-500': !error}"
            v-model="password"
            id="password"
            :type="showPassword ? 'text' : 'password'"
            tabindex="1"
            @focus="isPasswordFocused = true"
            @blur="isPasswordFocused = false"
            required="true"
          />
          <p v-if="isPasswordFocused" style="transform: translateY(50%)" class="text-gray-500 absolute bottom-1/2 right-3 cursor-pointer font-bold" @mousedown.prevent="toggleShowPassword" >{{showPassword ? 'Hide' : 'Show'}}</p>
          <UilArrowCircleUp v-if="capsLock && isPasswordFocused" style="transform: translateY(50%)" class="absolute text-gray-500 bottom-1/2 right-12"  size="18px" />
        </div>
      </div>
      <div v-if="showTwoFactor" class="text-xs text-gray-500 font-bold " :class="{'text-red-600': error, 'focus-within:text-blue-500': !error, 'opacity-40': isLoading}">
        <label for="2fa" id="2faLabel">Authentication code</label>
        <div class="relative">
          <input
            aria-labelledby="2faLabel"
            style="border-width: 1px;border-radius: 8px;"
            class="w-full h-10 focus:outline-none focus:ring-2  border-gray-300 px-3 font-bold text-gray-700 text-base bg-gray-50" 
            :class="{'ring-red-100 ring-2 border-red-600': error, 'ring-blue-300 focus:border-blue-500': !error}"
            v-model="twoFactorCode"
            id="2fa"
            type="text"
            tabindex="0"
            required="true"
          />
        </div>
        <p class="text-xs text-gray-400 mt-2">You have configured two factor authentication, please enter the 6 digit code</p>
      </div>

      <div v-if="!showTwoFactor" class="flex justify-center items-center pt-3">
        <a class="text-sm" :class="{'text-gray-400': isLoading, 'text-blue-600': !isLoading}" href="#" @click="open(`${DRIVE_BASE}/remove`)" tabindex="-1">Forgot your password?</a>
      </div>

        <button
          class="mt-6 native-key-bindings w-full text-white font-bold py-2.5 text-base focus:outline-none bg-blue-600 relative flex justify-end items-center h-10"
          style="border-radius: 8px"
          :class="{'cursor-default opacity-40': !online, 'cursor-pointer': online, 'bg-blue-700 text-opacity-60 text-white': isLoading}"
          type="submit"
          tabindex="-1"
          :disabled="!online"
        >
          <p style="transform: translate(-50%, -50%)" class="absolute left-1/2 top-1/2" :class="{'opacity-60': isLoading}">{{isLoading ? 'Logging in...'  : 'Login'}}</p>
          <UilSpinnerAlt v-if="isLoading" class="z-10 text-white animate-spin mr-3" size="22px" />
        </button>
      <div class="flex justify-center items-center pt-3">
        <a class="text-sm" :class="{'text-gray-400': isLoading, 'text-blue-600': !isLoading}" href="#" @click="open(`${DRIVE_BASE}/new`)" tabindex="-1">Create account</a>
      </div>
    </form>
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
import uuid4 from 'uuid4'
import Spinner from '../components/ExportIcons/Spinner'
import Eye from '../components/ExportIcons/eye'
import CrossEye from '../components/ExportIcons/cross-eye'
import Auth from '../logic/utils/Auth'
import { UilMultiply, UilArrowCircleUp, UilSpinnerAlt } from '@iconscout/vue-unicons'
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
      showPassword: false,
      capsLock: false,
      isPasswordFocused: false,
      error: null,
      online: navigator.onLine
    }
  },
  components: {
    Spinner,
    Eye,
    CrossEye,
    UilMultiply,
    UilArrowCircleUp,
    UilSpinnerAlt
  },

  mounted() {
    document.addEventListener('keyup', this.detectCapsLock)
    document.addEventListener('keydown', this.detectCapsLock)
    window.addEventListener('online', this.onOnlineChanged)
    window.addEventListener('offline', this.onOnlineChanged)

    this.$refs.emailInput.focus()
  },
  beforeDestroy() {
    document.removeEventListener('keyup', this.detectCapsLock)
    document.removeEventListener('keydown', this.detectCapsLock)
    window.removeEventListener('online', this.onOnlineChanged)
    window.removeEventListener('offline', this.onOnlineChanged)
  },
  methods: {
    toggleShowPassword() {
      this.showPassword = !this.showPassword
    },
    handleFormSubmit(e) {
      e.preventDefault()
      this.doLogin()
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
            if (res.body.error) {
              this.error = res.body.error
              return
            }
            this.error = 'There was an error while logging in'
            return
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
          this.error = err
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
              this.error = res.data.error
              if (res.data.error.includes('Wrong email')) {
                this.$data.twoFactorCode = ''
                this.$data.showTwoFactor = false
              }
            } else {
              this.error = 'There was an error while logging in'
            }
          } else {
            res.data.user.email = this.email.toLowerCase()
            this.createRootFolder()
            await database.Set(
              'xMnemonic',
              crypt.decryptWithKey(res.data.user.mnemonic, this.$data.password)
            )
            const savedCredentials = await database.logIn(res.data.user.email)
            await database.Set('xUser', res.data)
            Auth.denormalizeAuthInfoInConfigStore()
            await database.compactAllDatabases()
            remote.app.emit('update-configStore', {stopSync: false})
            // ConfigStore.set('stopSync', false)
            // this.$router.push('/landing-page').catch(() => {})
            if (!savedCredentials) {
              // remote.getCurrentWindow().setBounds({ width: 800, height: 500 })
              remote.app.emit('window-pushed-to', '/onboarding')
              this.$router.push('/onboarding').catch(() => {})
              remote.app.emit('enter-login', false)
            } else {
              remote.app.emit('window-pushed-to', '/xcloud')
              this.$router.push('/xcloud').catch(() => {})
              remote.app.emit('enter-login', false)
            }
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
    },
    quitApp() {
      remote.app.emit('sync-stop')
      remote.app.emit('app-close')
    },
    detectCapsLock(event) {
      this.capsLock = event.getModifierState('CapsLock')
    },
    onOnlineChanged() {
      this.online = navigator.onLine
    }
  }
}
</script>
