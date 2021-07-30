<template>
  <svg width="32" height="32" :class="playButtonState" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path v-if="playButtonState==='active'" d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="#0F62FE"/>
    <path v-else d="M0 20C0 8.95431 8.95431 0 20 0C31.0457 0 40 8.95431 40 20C40 31.0457 31.0457 40 20 40C8.95431 40 0 31.0457 0 20Z" fill="#DFE1E6"/>
    <path d="M29 18.1991C30.3333 18.9689 30.3333 20.8934 29 21.6632L17 28.5914C15.6667 29.3612 14 28.399 14 26.8594V13.003C14 11.4634 15.6667 10.5011 17 11.2709L29 18.1991Z" fill="white"/>
  </svg>
</template>

<script>
    export default {
      props: {
        playButtonState: {
          type: String,
          default: ''
        }
      }
    }
</script>
