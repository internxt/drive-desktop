<template>
  <div id="wrapper">
    <main class="centered-container">
        <div class="spinner-grow text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
    </main>
  </div>
</template>

<script>
import SystemInformation from './LandingPage/SystemInformation'
import { Environment } from 'storj'

export default {
  name: 'landing-page',
  components: { SystemInformation },
  created: function () {
    console.log('Check if login is already set, and if it\'s valid')

    if (!localStorage.getItem('xUser')) {
      this.$router.push('/login')
    } else {
      // Check if token is valid
      // Redirect
      // storj

      const userSettings = JSON.parse(localStorage.getItem('xUser'))
      const userMnemonic = localStorage.getItem('xMnemonic')

      if (localStorage.getItem('xPath')) {
        this.$router.push('/xcloud')
      } else {
        this.$router.push('/config')
      }

      const storj = new Environment({
        bridgeUrl: process.env.BRIDGE_URL,
        bridgeUser: userSettings.user.email,
        bridgePass: userSettings.user.userId,
        encryptionKey: userMnemonic
      })

      storj.getBuckets((err, result) => {
        console.log('Error', err)
        console.log('Results', result)
      })

      console.log(storj)
    }
  },
  methods: {
    opend (link) {
      this.$electron.shell.openExternal(link)
    }
  }
}
</script>

<style>
@import url("https://fonts.googleapis.com/css?family=Source+Sans+Pro");

.centered-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */
  cursor: default;
}

</style>
