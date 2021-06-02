<template>
    <div>
        <div>{{Brand}}</div>
        <div>{{appName}}</div>
        <div>{{SubtitleApp}}</div>
        <UilFolder size="16px" fill="var(--blue-60)" />
        <UilSetting size="16px" fill="var(--blue-60)" />
        <UilUserCircle size="16px" fill="var(--blue-60)" />
        

        <!-- <FolderIcon 
          :width="16"
          :height="16" />

        <ConfigIcon 
          :width="16"
          :height="16"
          :isActive="true"
          :fillWhite="true"
           /> -->

    </div>
</template>

<script>

import '../Header/Header'
import FolderIcon from '../ExportIcons/FolderIcon'
import ConfigIcon from '../ExportIcons/ConfigIcon'
import { UilFolder, UilSetting, UilUserCircle } from '@iconscout/vue-unicons'

export default {
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
    UilFolder,
    UilSetting,
    UilUserCircle
  }
}
</script>
<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
</style>
