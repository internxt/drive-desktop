<template>
  <div id="wrapper">
    <main>
      <div class="spinner-grow text-primary" role="status">
        <span class="sr-only">Syncing...</span>
      </div>
      <div><a href="#" @click="quitApp()">Quit</a></div>
    </main>
  </div>
</template>

<script>
import crypt from '../logic/crypt'
import path from 'path'
import temp from 'temp'
import fs, { existsSync } from 'fs'
import { Environment } from 'storj'
import async from 'async'
import database from '../../database/index'
import Sync from '../logic/sync'
import Tree from '../logic/tree'
import Monitor from '../logic/monitor'
import { remote } from 'electron'

export default {
  name: 'xcloud-page',
  data () {
    return {
      databaseUser: '',
      localPath: '',
      currentEnv: ''
    }
  },
  components: {},
  created: function () {
    if (process.env.NODE_ENV !== 'development') {
      remote.BrowserWindow.getFocusedWindow().hide()
    }
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
    this.getUser()
    this.getLocalFolderPath()
    this.getCurrentEnv()
  },
  methods: {
    quitApp () {
      remote.getCurrentWindow().close()
    },
    getUser () {
      database.Get('xUser').then(userInfo => {
        this.$data.databaseUser = userInfo.user.email
      }).catch(err => {
        console.error(err)
        this.$data.databaseUser = 'error'
      })
    },
    getLocalFolderPath () {
      database.Get('xPath').then(path => {
        this.$data.localPath = path
      }).catch(err => {
        console.error(err)
        this.$data.localPath = 'error'
      })
    },
    getCurrentEnv () {
      this.$data.currentEnv = process.env.NODE_ENV
    }
  }
}
</script>