<template>
	<div>
        <div v-if="user" class="flex items-center justify-between">
          <div class="flex items-center">
            <Avatar :userFullname="userFullname" size="56"/>
            <div class="ml-4">
              <p class="font-semibold text-lg text-gray-700 tracking-wide">
                {{ userFullname }}
              </p>
              <p class="tracking-wide text-sm">{{ user.email }}</p>
            </div>
          </div>
          <Button @click="logout">Log out</Button>
        </div>
        <div
          class="p-3 mt-4 bg-gray-100 border border-gray-400 rounded-xl"
          v-if="limit && usage"
        >
          <div class="flex justify-between items-center">
            <div>
              <div class="flex items-center">
                <p class="font-semibold mr-2 tracking-wide">
                  Current Plan
                </p>
                <div class="px-2 rounded bg-gray-200 text-gray-500" style="font-size:10px">
                  Individual
                </div>
              </div>
              <div class="mt-1 flex items-center">
                <div class="text-lg text-gray-600 font-semibold tracking-wide">
                  {{ limit }}
                </div>
                <!-- <div class="text-gray-400 text-lg tracking-wide ml-3">
                  $41.88 billed annually
                </div> -->
              </div>
            </div>
            <Button state="accent" @click="goToPricing">Upgrade</Button>
          </div>
          <div class="progress mt-4 h-1">
            <div
              class="progress-bar bg-blue-600"
              role="progressbar"
              :style="`width: ${percentageUsed}%`"
            ></div>
          </div>
          <div class="flex justify-between align-center mt-2 text-xs">
            <p class="font-semibold tracking-wide text-gray-600">
              Used {{ usage }} of {{ limit }}
            </p>
            <p class="text-gray-500">{{ percentageUsed }}% in use</p>
          </div>
        </div>
        <content-placeholders v-else :rounded="true" :centered="true" class="mt-4" style="height:142px;">
          <content-placeholders-img />
        </content-placeholders>
      </div>
</template>

<script>
import Avatar from '../Avatar/Avatar.vue'
import database from '../../../database/index'
import SpaceUsage from '../../logic/utils/spaceusage'
import Button from '../Button/Button.vue'
import bytes from 'bytes'
const remote = require('@electron/remote')

export default {
  name: 'AccountSection',
  components: {
    Avatar,
    Button
  },
  data() {
    return {
      user: null,
      usage: '',
      limit: ''
    }
  },
  mounted() {
    database.Get('xUser').then(({user}) => {
      this.user = user
    })
    remote.app.on('update-storage', data => {
      this.usage = data.usage
      this.limit = data.limit
    })
    SpaceUsage.updateUsage()
  },
  methods: {
    logout() {
      this.$store.originalDispatch('showSettingsDialog', {
        title: 'You are about to log out',
        description: 'Would you like to remember where your sync folder is the next time you log in?',
        answers: [{text: 'No'}, {text: 'Yes', state: 'accent'}],
        callback: (userResponse) => {
          if (userResponse.response === 0) {
            remote.app.emit('user-logout', true)
          } else {
            remote.app.emit('user-logout', false)
          }
        }
      })
    },
    goToPricing() {
      remote.shell.openExternal('https://www.internxt.com/pricing')
    }
  },
  computed: {
    userFullname() {
      if (!this.user) { return '' }

      return this.user.name + ' ' + this.user.lastname
    },
    percentageUsed() {
      return parseInt((bytes.parse(this.usage) / bytes.parse(this.limit)) * 100)
    }
  }
}
</script>