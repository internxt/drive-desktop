<template>
  <div id="wrapper">
    <main>
      <div class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
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
      bridgeInstance: null,
      queue: null
    }
  },
  components: {},
  mounted: function () {
    if (process.env.NODE_ENV !== 'development') {
      remote.BrowserWindow.getFocusedWindow().minimize()
    }
    this.$app = this.$electron.remote.app
    Monitor.Monitor(true)
  },
  methods: {
    quitApp () {
      remote.getCurrentWindow().close()
    }
  }
}
</script>