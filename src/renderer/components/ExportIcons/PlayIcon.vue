<template>
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" :width="width" height="height" :class="playStateButtons" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
    </div>
</template>

<script>
    export default {
      props: {
        playStateButtons: {
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
