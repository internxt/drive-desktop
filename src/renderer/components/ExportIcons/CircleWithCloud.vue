<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="viewBox"
    :fill="fillColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="23.5" cy="23.5" r="22.5" stroke="#78A9FF" stroke-width="2" />
    <path
      d="M17.8938 27.9927C15.2642 27.9927 13.1324 25.8265 13.1324 23.1544C13.1324 20.8477 14.721 18.9181 16.8471 18.4335C16.7531 18.0065 16.7035 17.5624 16.7035 17.1066C16.7035 13.7665 19.3682 11.0588 22.6553 11.0588C25.5351 11.0588 27.9372 13.1372 28.4882 15.8983C28.5278 15.8975 28.5674 15.8971 28.6071 15.8971C31.8941 15.8971 34.5589 18.6048 34.5589 21.9449C34.5589 24.8707 32.5141 27.3113 29.7974 27.8717M20.2745 31.6213L23.8456 35.25M23.8456 35.25L27.4167 31.6213M23.8456 35.25V20.7353"
      stroke="#78A9FF"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script>
export default {
  props: {
    width: {
      type: Number,
      default: '18'
    },
    height: {
      type: Number,
      default: '18'
    },
    viewBox: {
      type: Number,
      default: '0 0 47 47'
    },
    fillColor: {
      type: String,
      default: 'white'
    }
  }
}
</script>
