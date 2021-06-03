<template>
    <div>
      <div class="flex justify-between p-4">
        
        <div>
          <div>{{Brand}}</div>
          <div class="text-gray-800 text-xl font-extrabold">{{appName}}</div>
          <div class="text-sm font-extrabold">{{SubtitleApp}}</div>
        </div>

      <div class="flex">
        <UilFolderNetwork class="mr-3 fill-current text-blue-600 cursor-pointer" size="24px" />
        <UilSetting class="mr-3 fill-current text-blue-600 cursor-pointer" size="24px" />
        <UilUserCircle class="fill-current text-blue-600 cursor-pointer" size="24px" />
      </div>
      
      </div>

    </div>
</template>

<script>

import '../Header/Header.scss'
import FolderIcon from '../ExportIcons/FolderIcon'
import ConfigIcon from '../ExportIcons/ConfigIcon'
import { UilFolderNetwork, UilSetting, UilUserCircle } from '@iconscout/vue-unicons'

export default {
  methods: {
    debug() {
      // console.log(appName)
    }
  },
  name: 'Header',
  props: {
    appName: {
      type: String,
      default: 'Internxt'

    },
    SubtitleApp: {
      type: String,
      default: 'Aplication'
    },
    IconClass: {
      type: String,
      default: ''
    }
  },
  components: {
    FolderIcon,
    ConfigIcon,
    UilSetting,
    UilUserCircle,
    UilFolderNetwork
  }
}
</script>

