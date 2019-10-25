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
import database from '../../database/index'

export default {
  name: 'landing-page',
  components: { SystemInformation },
  created: async function () {
    const xUser = await database.Get('xUser')

    if (!xUser) {
      console.log('No xUser is set on database')
      this.$router.push('/login')
    } else {
      // Check if token is valid
      if (await database.Get('xPath')) {
        this.$router.push('/xcloud')
      } else {
        this.$router.push('/config')
      }
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
