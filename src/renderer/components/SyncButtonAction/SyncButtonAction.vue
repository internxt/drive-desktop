<template>
    <div class="pb-2">
        <div>
          <div class="relative">

            <div class="absolute -top-3 centerAbsolute">
              <div class="justify-center">
                <div class="flex justify-center">
                  <UilCloudDataConnection class="fill-current text-white bg-blue-600 text-3xl p-1.5 rounded-full cursor-pointer"/>
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
import './SyncButtonAction.scss'

export default ({
  methods: {
    debug() {
      // console.log(appName)
    }
  },
  name: 'SyncButtonAction',
  props: {

  },
  components: {
    UilCloudDataConnection
  }
})
</script>
