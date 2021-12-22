<template>
  <div id="wrapper"></div>
</template>

<script>
import * as Auth from '../../main/auth'
const remote = require('@electron/remote')

export default {
  name: 'landing-page',
  data: function() {
    return {
      dbFolder: ''
    }
  },
  async created() {
    const token = Auth.getToken()
    if (token) {
      remote.app.emit('window-pushed-to', '/xcloud')
      this.$router.push('/xcloud').catch(() => {})
    } else {
      remote.app.emit('window-pushed-to', '/login')
      this.$router.push('/login').catch(() => {})
      remote.app.emit('enter-login', true)
    }
  },
  methods: {
    opend(link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
</style>
