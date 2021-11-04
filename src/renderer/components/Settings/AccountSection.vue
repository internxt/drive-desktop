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
                <!-- <div class="px-2 rounded bg-gray-200 text-gray-500" style="font-size:10px">
                  Individual
                </div> -->
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
            <Button v-if="!itsUnlimited" state="accent" @click="goToPricing">Upgrade</Button>
          </div>
          <div v-if="!itsUnlimited" class="progress mt-4 h-1">
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
            <p class="text-gray-500" v-if="!itsUnlimited" >{{ percentageUsed }}% in use</p>
          </div>
        </div>
        <content-placeholders v-else :rounded="true" :centered="true" class="mt-4" style="height:142px;">
          <content-placeholders-img />
        </content-placeholders>
      </div>
</template>

<script>
import Avatar from '../Avatar/Avatar.vue'
import SpaceUsage from '../../logic/utils/spaceusage'
import Button from '../Button/Button.vue'
import bytes from 'bytes'
import analytics from '../../logic/utils/analytics'
import * as Auth from '../../../main/auth'
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
    this.user = Auth.getUser()
    remote.app.on('update-storage', data => {
      this.usage = data.usage
      this.limit = data.limit
      analytics.trackUsageAndLimit({
        usage: bytes.parse(data.usage),
        limit: bytes.parse(data.limit)
      })
    })
    SpaceUsage.updateUsage()
  },
  methods: {
    goToPricing() {
      analytics.trackUpgradeButton()
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
    },
    itsUnlimited() {
      return this.limit === '\u221E'
    }
  }
}
</script>