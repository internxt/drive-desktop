<template>
    <div>
      <div class="flex justify-between p-4">
        
        <div>
          <!-- <div>{{Brand}}</div> -->
          <div class="text-gray-800 text-xl font-extrabold">{{appName}}</div>
          <div class="text-sm font-extrabold">{{SubtitleApp}}</div>
        </div>

      <div class="flex">
        <UilFolderNetwork class="mr-3 fill-current text-blue-600 cursor-pointer" size="24px" />
        <UilSetting class="mr-3 fill-current text-blue-600 cursor-pointer" size="24px"/>
        <UilUserCircle class="fill-current text-blue-600 cursor-pointer" size="24px" />
      </div>
      
      </div>


      <!-- <button type="primary" @click="showDrawer">
        Open
      </button>

      <a-drawer       
        title="Basic Drawer"
        :placement="right"
        :closable="false"
        :visible="visible"
        :after-visible-change="afterVisibleChange"
        @close="onClose">
          xxxx
      </a-drawer> -->
    </div>

    
</template>

<script>

import '../Header/Header.scss'
import FolderIcon from '../ExportIcons/FolderIcon'
import ConfigIcon from '../ExportIcons/ConfigIcon'
import { UilFolderNetwork, UilSetting, UilUserCircle } from '@iconscout/vue-unicons'
import 'ant-design-vue/dist/antd.css'
// import { Drawer } from 'ant-design-vue'

export default {
  data() {
    return {
      visible: false,
      placement: 'left'
    }
  },
  methods: {
    debug() {
      // console.log(appName)
    },
    afterVisibleChange(val) {
      console.log('visible', val)
    },
    showDrawer() {
      this.visible = true
    },
    onClose() {
      this.visible = false
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
    // Drawer
  }
}
</script>

