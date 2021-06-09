<template>
  <div id="wrapper">
    ..cargando
  </div>
</template>

<script>
import SystemInformation from './LandingPage/SystemInformation'
import database from '../../database'
import async from 'async'
import Logger from '../../libs/logger'
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
      // Check if token is valid
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
