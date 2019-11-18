<template>
  <div id="wrapper">
    <main class="centered-container">
      <div class="login-container-box">
        <div class="login-logo-container"><img src="../../resources/icons/xcloud.png" class="logo" /></div>
        <div class="login-title">{{showTwoFactor ? 'Security Verification' : 'Sign in to X Cloud Desktop'}}</div>
        <div v-if="!showTwoFactor">
          <input
            class="form-control"
            v-model="username"
            type="text" placeholder="Email address" />
          <input
            class="form-control"
            v-model="password"
            type="password" placeholder="Password" />
          <div class="form-control-file">
            <input
              class="form-control"
              v-model="storagePath"
              :disabled="true"
              type="text" placeholder="Select an empty folder" />
            <div class="form-control-fake-file"  @click="selectFolder()"></div>
          </div>
          <p
            v-if="storagePath && !isEmptyFolder(storagePath)"
            class="form-error">
              This folder is not empty
          </p>
        </div>
        <div v-if="showTwoFactor">
          <div>Enter your 6 digit authenticator code below</div>
          <input
            class="form-control"
            v-model="twoFactorCode"
            type="text" placeholder="Authentication code" />
        </div>
        <input
          class="form-control btn-block btn-primary"
          type="submit"
          :disabled="checkForm()"
          @click="savePathAndLogin()"
          value="Sign in" />

        <div v-if="!showTwoFactor" class="create-account-container">Don't have an account? <a href="#" @click="open('https://cloud.internxt.com/new')">Create an account for free</a></div>
      </div>
    </main>
  </div>
</template>

<script>
import crypt from '../logic/crypt'
import database from '../../database/index'
import { remote } from 'electron'
import fs from 'fs'

export default {
  name: 'login-page',
  data () {
    return {
      username: '',
      password: '',
      storagePath: '',
      showTwoFactor: false,
      twoFactorCode: ''
    }
  },
  components: { },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },
    selectFolder () {
      var path = remote.dialog.showOpenDialog({ properties: ['openDirectory'] })
      if (path && path[0]) {
        this.$data.storagePath = path[0]
        // this.$data.folderIsEmpty = this.isEmptyFolder(path[0])
      }
    },
    isEmptyFolder (path) {
      if (!fs.existsSync(path)) {
        return true
      } else {
        var filesInFolder = fs.readdirSync(path)
        return filesInFolder.length === 0
      }
    },
    checkForm () {
      return this.$data.username &&
      this.$data.password &&
      this.$data.storagePath &&
      !this.isEmptyFolder(this.$data.storagePath)
    },
    savePathAndLogin () {
      database.Set('xPath', this.$data.storagePath).then(() => {
        this.doLogin()
      }).catch(err => {
        console.error(err)
        alert(err)
      })
    },
    doLogin () {
      fetch('https://cloud.internxt.com/api/login', {
        method: 'POST',
        mode: 'cors',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: this.$data.username })
      }).then(async res => {
        return { res, body: await res.json() }
      }).then(res => {
        if (res.res.status !== 200) {
          return alert('Login error')
        }
        if (res.body.tfa && !this.$data.twoFactorCode) {
          this.$data.showTwoFactor = true
        } else {
          this.doAccess(res.body.sKey)
        }
      }).catch(err => {
        console.error(err)
      })
    },
    doAccess (sKey) {
      const salt = crypt.Decrypt(sKey)
      const pwd = crypt.HashPassword(this.$data.password, salt)
      const encryptedHash = crypt.Encrypt(pwd.hash.toString())

      fetch(`https://cloud.internxt.com/api/access`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          email: this.$data.username,
          password: encryptedHash,
          tfa: this.$data.twoFactorCode
        })
      }).then(async res => {
        return { res, data: await res.json() }
      }).then(async res => {
        if (res.res.status !== 200) {
          if (res.data.error) {
            alert('Login error\n' + res.data.error)
            if (res.data.error.includes('Wrong email')) {
              this.$data.twoFactorCode = ''
              this.$data.showTwoFactor = false
            }
          } else {
            alert('Login error')
          }
        } else {
          res.data.user.email = this.$data.username
          await database.Set('xMnemonic', crypt.DecryptWithKey(res.data.user.mnemonic, this.$data.password))
          await database.Set('xUser', res.data)
          this.$router.push('/landing-page')
        }
      }).catch(err => {
        console.log('Error', err)
      })
    }
  }
}
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

  @font-face {
    font-family: 'CerebriSans-Regular';
    src: url('../../resources/fonts/CerebriSans-Regular.ttf');
  }

  .centered-container {
    font-family: 'CerebriSans-Regular'
  }

  input {
    border: solid 1px;
    margin: 0px 4px 0px 0px;
  }

  .logo {
    width: 50px;
    display: block;
  }

  .form-control {
    margin-top: 15px;
    height: 50px !important;
  }

  .btn-primary {
    margin-top: 39px !important;
    background-color: #4585f5 !important;
    font-weight: bold !important;
  }

  .login-container-box {
    background-color: #fff;
    width: 472px !important;
    padding: 40px !important;
  }

  .login-title {
    font-size: 25px;
    font-weight: 600;
    margin-bottom: 20px;
  }

  .create-account-container {
    margin-top: 39px;
    color: #909090;
  }

  .form-control-file {
    position: relative;
    display: inline-block;
  }

  .form-control-file::before {
    position: absolute;
    content: url('../../resources/icons/arrow-right.svg');
    top: 25%;
    right: -8px;
    height: 50px;
    width: 40px;
  }

  input[type="text"]:disabled {
    background-color: white !important;
  }

  input[type="submit"]:disabled {
    background-color: #7aa5ee !important;
  }

  .form-control-fake-file {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .form-error {
    color: red;
    font-size: 13px;
    margin: 0px;
  }
</style>
