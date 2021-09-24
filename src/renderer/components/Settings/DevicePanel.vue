<template>
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
    <input ref="field" v-if="editing" v-model="nameToEdit" type="text" />
    <p v-else>{{ device.name }}</p>
    <component
      :is="editing ? UilSave : UilPen"
      class="text-gray-400 ml-1 cursor-pointer"
      size="15px"
      @click.native="editing = !editing"
    />
  </div>
  <content-placeholders v-else class="h-7" :centered="true" :rounded="true">
    <content-placeholders-text :lines="1"/>
  </content-placeholders>
</template>

<script>
import {getDeviceByMac, createDevice, updateDevice} from '../../../backup-process/service'
import {
  UilPen,
  UilSave
} from '@iconscout/vue-unicons'
export default {
  data() {
    return {
      device: null,
      editing: false,
      UilPen,
      UilSave,
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
    }
  },
  watch: {
    editing(newVal) {
      if (!newVal && this.nameToEdit) {
        this.device.name = this.nameToEdit
        updateDevice(this.device.id, this.device.name)
      } else if (!newVal) { this.nameToEdit = this.device.name } else if (newVal) { this.$nextTick(() => this.$refs.field.focus()) }
    }
  }

}
</script>