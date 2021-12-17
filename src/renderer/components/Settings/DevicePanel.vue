<template>
  <div>
    <div v-if="device">
      <p class="text-xs text-gray-600 mb-1">
        Device name
      </p>
      <div
        class="
        flex
        items-center
        text-lg
        font-semibold
        tracking-wide
      "
        v-if="device"
      >
        <input
          @blur="saveName"
          @keypress.enter="saveName"
          @keyup.esc="stopEditing"
          ref="field"
          v-if="editing"
          v-model="nameToEdit"
          type="text"
          style="border-radius: 8px; border-width: 1px"
          class="h-8 w-full outline-none ring-2 px-3 font-bold text-gray-700 text-base bg-gray-50 ring-blue-300 border-blue-500 tracking-wider"
        />
        <p class="h-8 tracking-wider" style="line-height: 32px" v-else>
          {{ device.name }}
        </p>

        <UilPen
          v-if="!editing"
          size="15px"
          class="text-gray-400 ml-2 cursor-pointer"
          @click.native="startEditing"
        />
        <UilCheck
          v-if="editing"
          size="32px"
          class="text-white ml-1 cursor-pointer px-1 flex-shrink-0"
          style="border-radius: 8px;background-color: #0f62fe"
          @click.native="saveName"
        />
        <UilMultiply
          v-if="editing"
          size="32px"
          style="border-radius: 8px; padding: 7px"
          class="text-gray-500 bg-gray-200 cursor-pointer ml-1 flex-shrink-0"
          @click.native="stopEditing"
        />
      </div>
    </div>
    <content-placeholders
      v-else
      style="height:52px"
      :centered="false"
      :rounded="true"
    >
      <content-placeholders-text :lines="1" />
    </content-placeholders>
  </div>
</template>

<script>
import {
  getDeviceByMac,
  createDevice,
  updateDevice
} from '../../../backup-process/service'
import analytics from '../../logic/utils/analytics'
import { UilPen, UilCheck, UilMultiply } from '@iconscout/vue-unicons'
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
