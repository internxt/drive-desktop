<template>
  <div id="wrapper">
    <main class="centered-container">
      <img src="../../resources/icons/xcloud.png" class="logo" />
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
    </main>
  </div>
</template>

<script>
  import crypt from '../logic/crypt'

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
        // const username = this.$data.username
        // const password = this.$data.password
        // console.log(username, password);
        console.log(process.env)

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
        }).then(res => {
          if (res.res.status !== 200) {
            if (res.data.error) {
              alert('Login error\n' + res.data.error)
            } else {
              alert('Login error')
            }
          } else {
            res.data.user.email = this.$data.username
            localStorage.setItem('xMnemonic', crypt.DecryptWithKey(res.data.user.mnemonic, this.$data.password))
            localStorage.setItem('xUser', JSON.stringify(res.data))
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
    width: 40px;
    margin: auto;
    display: block;
  }
</style>
