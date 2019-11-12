<template>
  <div id="wrapper">
    <main class="centered-container">
      <div class="login-container-box">
        <div class="login-logo-container"><img src="../../resources/icons/xcloud.png" class="logo" /></div>
        <div class="login-title">Sign in to X Cloud Desktop</div>
        <input
          class="form-control"
          v-model="username"
          type="text" placeholder="Email address" />
        <input
          class="form-control"
          v-model="password"
          type="password" placeholder="Password" />
        <input
          class="form-control btn-block btn-primary"
          type="submit"
          @click="doLogin()"
          value="Sign in" />
      </div>
    </main>
  </div>
</template>

<script>
import crypt from '../logic/crypt'
import database from '../../database/index'

export default {
  name: 'login-page',
  data () {
    return {
      username: '',
      password: ''
    }
  },
  components: { },
  methods: {
    open (link) {
      this.$electron.shell.openExternal(link)
    },
    doLogin () {
      fetch('https://cloud.internxt.com/api/login', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ email: this.$data.username })
      }).then(async res => {
        return { res, body: await res.json() }
      }).then(res => {
        if (res.res.status !== 200) {
          return alert('Login error')
        }
        if (res.body.tfa) {
          throw Error('TFA not implemented yet')
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

      fetch(`${process.env.API_URL}/access`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          email: this.$data.username,
          password: encryptedHash,
          tfa: null
        })
      }).then(async res => {
        return { res, data: await res.json() }
      }).then(async res => {
        if (res.res.status !== 200) {
          if (res.data.error) {
            alert('Login error\n' + res.data.error)
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

  input {
    border: solid 1px;
    margin: 4px;
  }

  .logo {
    width: 50px;
    display: block;
  }

  .form-control {
    margin-bottom: 15px;
    height: 50px !important;
  }

  .btn-primary {
    margin-top: 30px !important;
    background-color: #4585f5 !important;
    font-weight: bold !important;
  }

  .login-container-box {
    background-color: #fff;
    width: 472px !important;
    border: 1px solid #eaeced;
    border-radius: 6px;
    padding: 40px !important;
  }

  .login-title {
    font-size: 25px;
    font-weight: 600;
    margin-bottom: 20px;
  }
</style>
