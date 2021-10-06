<template>
<div v-if="error" class="flex items-center space-x-2 ml-2">
  <p class="text-xs whitespace-nowrap" :class="{'text-yellow-400': type === 'WARN', 'text-red-600': type === 'FATAL'}">{{text}}</p>
  <p @click="$emit('actionClick', actionCode)" class="text-xs underline whitespace-nowrap cursor-pointer" :class="{'text-yellow-500': type === 'WARN', 'text-red-700': type === 'FATAL'}">{{action}}</p>
  <img src="../../assets/icons/apple/warn.svg" v-if="type === 'WARN'" class="flex-shrink-0" />
  <img src="../../assets/icons/apple/error.svg" v-else class="flex-shrink-0" />
</div>
</template>

<script>
import ErrorCodes from '../../../backup-process/error-codes'
import { UilExclamationTriangle } from '@iconscout/vue-unicons'
export default {
  props: ['error'],
  components: {
    UilExclamationTriangle
  },
  computed: {
    type() {
      if ([ErrorCodes.NO_CONNECTION, ErrorCodes.UNKNOWN].includes(this.error.error_code)) {
        return 'FATAL'
      } else {
        return 'WARN'
      }
    },
    text() {
      switch (this.error.error_code) {
        case ErrorCodes.NOT_FOUND:
          return 'Folder missing'
        case ErrorCodes.PATH_IS_NOT_DIRECTORY:
          return 'Path is not a folder'
        case ErrorCodes.NO_CONNECTION:
          return 'Connectivity issues'
        default:
          return 'An unknown error has ocurred'
      }
    },
    action() {
      if (this.type === 'FATAL') {
        return 'Try again'
      } else {
        return 'Find folder'
      }
    },
    actionCode() {
      if (this.type === 'FATAL') {
        return 'TRY_AGAIN'
      } else {
        return 'FIND_FOLDER'
      }
    }
  }
}
</script>