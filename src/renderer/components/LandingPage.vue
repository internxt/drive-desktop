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
import Logger from '../../libs/logger'
import ConfigStore from '../../main/config-store'
import semver from 'semver'
import PackageJson from '../../../package.json'
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
    /*
     Relogs automatically a user in
    */
    const xUser = await database.Get('xUser')
    // const xPath = await database.Get('xPath')
    this.$data.dbFolder = database.GetDatabaseFolder
    if (!xUser) {
      Logger.info('No xUser is set on database')

      await database.ClearAll()
      await database.compactAllDatabases()

      remote.app.emit('window-pushed-to', '/login')
      this.$router.push('/login').catch(() => {})
      remote.app.emit('enter-login', true)
    } else {
      // Does have credentials saved ? If not show onboarding the user is already singned in so email in configStore
      const lastVersion = ConfigStore.get('version')
      if (semver.gt(PackageJson.version, lastVersion)) {
        // Show Onboarding
        remote.app.emit('window-pushed-to', '/onboarding')
        this.$router.push('/onboarding').catch(() => {})
      } else {
        // Go to logger
        remote.app.emit('window-pushed-to', '/xcloud')
        this.$router.push('/xcloud').catch(() => {})
      }
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
