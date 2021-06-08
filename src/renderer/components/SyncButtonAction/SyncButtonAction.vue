<template>
    <div class="pb-2">
        <div>
          <div class="relative">

            <div class="absolute -top-3 centerAbsolute">
              <div class="justify-center">
                <div class="flex justify-center">
                  <div class="flex mb-2" v-if="syncState === true">
                    no
                  </div>
                  <div class="flex mb-2" v-else>
                    <div @click="forceSync()">
                      <UilCloudDataConnection class="fill-current text-white bg-blue-600 text-3xl p-1.5 rounded-full cursor-pointer hover:bg-indigo-900 shadow-2xl transition duration-500 ease-in-out"/>
                    </div>
                  </div>

                  <!-- Capturar startsync y endsync
                  v-if si estarsync existe boton disabled
                  v-if si existe endsync boton enabled -->
                </div>
                <div class="flex justify-center">
                  <div class="text-xs text-blue-600 mt-1">Full sync</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="text-xs text-gray-500 text-center pt-12">
          Not synchronizations yet. Start on click <span class="text-blue-600">Full sync</span> button
        </div>

    </div>
</template>
<script>

import { UilCloudDataConnection } from '@iconscout/vue-unicons'
import ConfigStore from '../../../main/config-store'
import './SyncButtonAction.scss'

const remote = require('@electron/remote')

export default ({
  data() {
    return {
      syncState: false
    }
  },
  methods: {
    cambiarEstado() {

    },
    debug() {
      // console.log(appName)
    },
    forceSync() {
      remote.app.emit('sync-start')
      this.syncState = true
      console.log(this.syncState)
    },
    StopForceSync() {
      remote.app.on('sync-off', (_) => {
        // TODO
      })
      return console.log('hola')
    }
  },
  updateSyncButton(syncState) {
    console.log('SYNCSTATE', syncState)
    this.isSyncing = syncState
  },
  created: function() {
    remote.app.on('sync-off', (isSyncing) => {
      this.syncState = isSyncing
      console.log(this.syncState)
    })
    remote.app.on('sync-stop', (isSyncing) => {
      this.syncState = isSyncing
      console.log(this.syncState)
    })
    // remote.app.on('sync-on', (isSyncing) => {
    //   this.syncState = isSyncing
    //   console.log(this.syncState)
    // })
    console.log('sale', ConfigStore.get('stopSync'))
  },
  updated: function() {
    console.log('entra', ConfigStore.get('stopSync'))
  },
  computed: {

  },
  name: 'SyncButtonAction',
  props: {

  },
  components: {
    UilCloudDataConnection
  }
})
</script>
