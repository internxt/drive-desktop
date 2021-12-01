<template>
  <div>
    <p class="text-gray-600 text-sm">Selective Sync</p>
    <div class="bg-gray-100 p-4 rounded-md mt-1">
      <p class="text-gray-500 text-xs">
        Select the folders you want to sync with this device. Folders that
        aren't selected will be available only on
        <span class="underline text-blue-500 cursor-pointer"
          >drive.internxt.com</span
        >.
      </p>
      <Button class="mt-2">Select folders</Button>
    </div>
    <p class="text-gray-600 text-sm mt-4">Internxt Drive folder location</p>
    <div class="bg-gray-100 p-4 rounded-md mt-1">
      <p class="text-gray-500 text-xs">
        Select where your Internxt Drive is located on this device.
      </p>
      <div class="flex items-center justify-between mt-2">
        <div class="flex items-center">
          <img
            :src="FolderIcon"
            style="margin-right: 6px; width:14px;height:14px"
            class="flex-shrink-0"
          />
          <p>home</p>
        </div>
        <Button class="mt-2">Change location</Button>
      </div>
    </div>
  </div>
</template>

<script>
import Button from '../Button/Button.vue'
import FolderIcon from '../../assets/icons/apple/folder.svg'
export default {
  components: { Button },
  data() {
    return { FolderIcon }
  }
}
</script>
