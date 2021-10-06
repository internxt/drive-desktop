<template>
  <svg width="28" height="28" :class="stopButtonState" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path v-if="stopButtonState==='active'" d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="#0F62FE"/>
    <path v-else d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="#DFE1E6"/>
    <rect x="12" y="12" width="16" height="16" rx="2" fill="white"/>
  </svg>
</template>

<script>
    export default {
      props: {
        stopButtonState: {
          type: String,
          default: ''
        }
      }
    }
</script>
