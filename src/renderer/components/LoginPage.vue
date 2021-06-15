<template>
  <main class="w-full h-full flex flex-col justify-center bg-white px-12 relative">
    <div class="cursor-pointer absolute top-6 right-6" @click="quitApp()">
      <UilMultiply class="mr-2 text-blue-600" />
    </div>

    <div class="flex flex-row items-center">
      <img class="w-5" src="../assets/icons/apple/brand-logo.png" />
      <span class="text-xl text-black font-bold ml-2">{{ showTwoFactor ? 'Security Verification' : 'Sign in to Internxt Drive' }}</span>
    </div>

    <form class="mt-8 bg-white relative"
      id="form"
      @submit="handleFormSubmit"
    >
      <input
        class="w-full h-10 focus:outline-none focus:ring focus:ring-2 focus:border-blue-300 mb-3 border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="email"
        type="text"
        placeholder="Email address"
        tabindex="0"
        :disabled="showTwoFactor"
      />
      <input
        v-if="!showTwoFactor"
        class="w-full h-10 focus:outline-none focus:ring focus:ring-2 focus:border-blue-300 border border-gray-300 rounded px-2 text-xs font-bold"
        v-model="password"
        :type="visibility"
        placeholder="Password"
        tabindex="0"
      />
      <div v-if="showTwoFactor" class="-mb-4">
        <input
          class="w-full h-10 focus:outline-none focus:ring focus:ring-2 focus:border-blue-300 border border-gray-300 rounded px-2 text-xs font-bold"
          v-model="twoFactorCode"
          type="text"
          placeholder="Authentication code"
        />
        <p class="mt-1">Enter your 6 digit authenticator code above</p>
    </div>

      <!-- Shows the password -->
      <div v-if="visibility === 'password' && !showTwoFactor" @click="showPassword()" class="absolute right-6 -mt-7 cursor-pointer">
        <Eye />
      </div>

      <!-- Hides the password -->
      <div v-if="visibility === 'text' && !showTwoFactor" @click="hidePassword()" class="absolute right-6 -mt-7 cursor-pointer">
        <CrossEye />
      </div>

        <div v-if="errors.length" class="mt-2 -mb-4">
          <p v-if="errors.length > 1" class="text-sm text-black font-bold">There have been errors</p>
          <p v-else class="text-sm text-black font-bold">There has been an error</p>

          <ul class="list-disc ml-6">
            <li v-for="error in errors" :key="error">
              {{ error }}
            </li>
          </ul>
        </div>

      <!-- </transition> -->

      <div class="flex flex-row relative">
        <div v-if="isLoading" class="flex items-center justify-center absolute bg-blue-500 bottom-2.5 left-0 right-0">
          <Spinner class="animate-spin z-10" />
        </div>
        <input
          class="native-key-bindings w-full text-white font-bold mt-8 py-2.5 text-sm rounded focus:outline-none cursor-pointer bg-blue-500"
          type="submit"
          value="Sign in"
          tabindex="-1"
        />
      </div>
    </form>

    <div class="flex justify-between text-xs font-bold mt-4">
      <div class="flex">
        <span class="text-gray-400">Don't have an Internxt account?</span>
        <a class="text-blue-400 ml-1" href="#" @click="open(`${DRIVE_BASE}/new`)" tabindex="-1">Get one for free!</a>
      </div>

      <div class="text-gray-300 text-xs">v{{ version }}</div>
    </div>
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
import { UilMultiply } from '@iconscout/vue-unicons'
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
      errors: [],
      visibility: 'password'
    }
  },
  components: {
    Spinner,
    Eye,
    CrossEye,
    UilMultiply
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
            const savedCredentials = await database.logIn(res.data.user.email)
            await database.Set('xUser', res.data)
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
    }
  }
}
</script>
