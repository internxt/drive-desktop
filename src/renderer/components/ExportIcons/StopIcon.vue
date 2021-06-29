<template>
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" :width="width" height="height" :class="stopButtonState" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
        </svg>
    </div>
</template>

<script>
    export default {
      props: {
        stopButtonState: {
          type: String,
          default: ''
        },
        width: {
          type: String,
          default: '1.25rem'
        },
        height: {
          type: String,
          default: '1.25rem'
        }
      }
    }
</script>
