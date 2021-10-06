<template>
<div>
  <div v-if="device" class="flex flex-col items-center">
    <p class="text-xs text-gray-400 mb-1" :class="{'text-gray-400': !editing, 'text-blue-500': editing}">Device name</p>
    <div
      class="
        flex
        justify-center
        items-center
        text-lg
        font-semibold
        tracking-wide
      "
      v-if="device"
    >
      <input @blur="saveName" @keypress.enter="saveName" @keyup.esc="stopEditing" ref="field" v-if="editing" v-model="nameToEdit" type="text" style="border-radius: 8px; border-width: 1px;margin-left: 60px" class="w-1/2 h-8 outline-none ring-2  px-3 font-bold text-gray-700 text-base bg-gray-50 ring-blue-300 border-blue-500" />
      <p v-else style="margin-left: 23px">{{ device.name }}</p>

      <UilPen v-if="!editing" size="15px" class="text-gray-400 ml-2 cursor-pointer" @click.native="startEditing"/>
      <UilCheck v-if="editing" size="22px" class="text-blue-500 ml-2 cursor-pointer p-1 bg-blue-100 rounded-full" @click.native="saveName"/>
      <UilMultiply v-if="editing" size="22px" class="text-gray-500 bg-gray-100 p-1 cursor-pointer rounded-full ml-2" @click.native="stopEditing"/>
    </div>
  </div>
  <content-placeholders v-else class="h-7" :centered="true" :rounded="true">
    <content-placeholders-text :lines="1"/>
  </content-placeholders>
</div>
</template>

<script>
import {getDeviceByMac, createDevice, updateDevice} from '../../../backup-process/service'
import analytics from '../../logic/utils/analytics'
import {
  UilPen,
  UilCheck,
  UilMultiply
} from '@iconscout/vue-unicons'
export default {
  components: {
    UilMultiply,
    UilPen,
    UilCheck
  },
  data() {
    return {
      device: null,
      editing: false,
      nameToEdit: ''
    }
  },
  mounted() {
    this.getOrCreateDevice()
  },
  methods: {
    async getOrCreateDevice() {
      try {
        this.device = await getDeviceByMac()
      } catch (err) {
        this.device = await createDevice()
      } finally {
        this.nameToEdit = this.device.name
      }
    },
    startEditing() {
      this.editing = true
      process.nextTick(() => this.$refs.field.focus())
    },
    stopEditing() {
      this.editing = false
      this.nameToEdit = this.device.name
    },
    saveName() {
      if (this.nameToEdit.length && this.nameToEdit.length <= 40) {
        updateDevice(this.device.id, this.nameToEdit)
        this.device.name = this.nameToEdit
        analytics.trackDeviceName({
          device_name: this.device.name
        })
      }
      this.stopEditing()
    }
  }
}
</script>