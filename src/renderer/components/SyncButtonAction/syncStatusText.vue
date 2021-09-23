<template>
<div class="flex items-center justify-center"> <!-- :class="syncState === 'pending' ? 'animate-pulse' : null" -->
  <!--
    <div>{{msg.line1}}</div>
    <div class="flex">{{msg.line2}}</div>
  -->
  <div class="flex text-sm">
    <img v-if="icon" class="mr-1" :src="icon" width="20px" height="20px">
    <div v-if="syncState === 'pending'" class="flex items-center"><SyncSpinner class="mr-2 animate-spin" width="18" height="18"/></div>
    <div :class="syncState === 'pending' ? 'animate-pulse' : null">
      {{msg.line1}}
    </div>
    <div v-if="syncState === 'complete'" class="flex items-center"><CheckSuccess class="mr-2" width="18" height="18"/>{{lastUpdatemsg}}</div>
  </div>
</div>
</template>

<script>
import {
  UilCloudDataConnection,
  UilSync
} from '@iconscout/vue-unicons'
import CheckSuccess from '../Icons/CheckSuccess.vue'
import SyncSpinner from '../Icons/SyncSpinner.vue'
export default {
  data () {
    return {
      lastUpdate: '',
      lastUpdatemsg: ''
    }
  },
  props: {
    syncState: {
      type: String
    },
    msg: {
      type: Object
    },
    icon: {
      type: Object
    }
  },
  methods: {
    startTimer() {
      this.lastUpdate = Date.now()
      this.setlastUpdatemsg()
      // console.log('%cTimer reset', 'background: #A7F0BA; color: #198038')
      setInterval(() => {
        this.setlastUpdatemsg()
      }, 1000)
    },
    restartTimer() {
      this.lastUpdate = Date.now()
      // console.log('%cTimer reset', 'background: #A7F0BA; color: #198038')
    },
    getLastUpdate() {
      return {
        's': this.getLastUpdateSeconds() % 60 || 0,
        'm': parseInt(this.getLastUpdateSeconds() / 60) % 60 || 0,
        'h': parseInt(this.getLastUpdateSeconds() / 60 / 60) % 24 || 0,
        'd': parseInt(this.getLastUpdateSeconds() / 60 / 60 / 24) || 0
      }
    },
    getLastUpdateSeconds() {
      return parseInt(Math.abs(this.lastUpdate - Date.now()).toString().slice(0, -3))
    },
    setlastUpdatemsg() {
      if (this.syncState === 'pending') {
        this.restartTimer()
      }
      if (this.syncState === 'complete') {
        if (this.getLastUpdate()['m'] < 1) this.lastUpdatemsg = 'Updated just now' // < 60 seconds
        else if (this.getLastUpdate()['m'] >= 1 && this.getLastUpdate()['m'] < 2) this.lastUpdatemsg = `Updated ${this.getLastUpdate()['m']} minute ago` // 1 minute
        else if (this.getLastUpdate()['m'] >= 2 && this.getLastUpdate()['m'] < 5) this.lastUpdatemsg = `Updated ${this.getLastUpdate()['m']} minutes ago` // from 2 to 5 minutes
        else if (this.getLastUpdate()['m'] >= 5 && (this.getLastUpdate()['m'] <= 60 && this.getLastUpdate()['m'] % 10 === 0)) this.lastUpdatemsg = `Updated ${this.getLastUpdate()['m']} minutes ago` // < 1 hour and every 10 minutes
        else if (this.getLastUpdate()['h'] >= 1 && this.getLastUpdate()['h'] < 24) this.lastUpdatemsg = `Updated ${this.getLastUpdate()['h']} hours ago` // > 1 and < 1 day
        else if (this.getLastUpdate()['d'] >= 1) this.lastUpdatemsg = `Updated ${this.getLastUpdate()['d']} days ago` // > 1 day
        else this.lastUpdatemsg = 'Updated just now'
        // console.log('%cUpdating last update msg: ', 'background: #EDF5FF; color: #0F62FE', this.getLastUpdate())
      }
    }
  },
  created () {
    this.startTimer()
  },
  components: {
    UilCloudDataConnection,
    CheckSuccess,
    UilSync,
    SyncSpinner
  }
}
</script>
