<template>
  <div id="wrapper">
    <main class="centered-container">
        <div class="spinner-grow text-primary" role="status">
          <span class="sr-only">Loading...</span>
        </div>
        <div><a href="" @click="clearDatabase()">Clear data</a></div>
    </main>
  </div>
</template>

<script>
import SystemInformation from './LandingPage/SystemInformation'
import database from '../../database/index'
import async from 'async'

export default {
  name: 'landing-page',
  components: { SystemInformation },
  data: function () {
    return {
      dbFolder: ''
    }
  },
  created: async function () {
    const xUser = await database.Get('xUser')
    this.$data.dbFolder = database.GetDatabaseFolder
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
    },
    clearDatabase () {
      var confirmation = confirm('ATTENTION:\nAll your X Cloud Desktop data will be lost forever.\n\nContinue?')
      if (confirmation) {
        async.waterfall([
          (next) => {
            database.dbFiles.remove({}, {multi: true}, (err, n) => next(err, n))
          },
          (next) => {
            database.dbFolders.remove({}, {multi: true}, (err, n) => next(err, n))
          },
          (next) => {
            database.dbUser.remove({}, {multi: true}, (err, n) => next(err, n))
          }
        ], (err, result) => {
          if (err) {
            alert('Error clearing database\n\n' + err)
          } else {
            this.$router.push('/login')
          }
        })
      }
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
