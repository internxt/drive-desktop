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
import database from '../../database'
import async from 'async'
import Logger from '../../libs/logger'
import ConfigStore from '../../main/config-store'
import fs from 'fs'
const remote = require('@electron/remote')

export default {
  name: 'landing-page',
  components: { SystemInformation },
  beforeCreate() {
    remote.app.emit('window-hide')
  },
  data: function () {
    return {
      dbFolder: ''
    }
  },
  created: async function () {
    const xUser = await database.Get('xUser')
    // const xPath = await database.Get('xPath')
    this.$data.dbFolder = database.GetDatabaseFolder
    if (!xUser) {
      Logger.info('No xUser is set on database')

      await database.ClearAll()
      await database.compactAllDatabases()

      this.$router.push('/login').catch(() => {})
    } else {
      this.$router.push('/xcloud').catch(() => {})
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
