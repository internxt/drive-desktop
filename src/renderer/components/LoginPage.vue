<template>
  <div id="wrapper">
    <main>
      Loading...
    </main>
  </div>
</template>

<script>
  export default {
    name: 'login-page',
    components: { },
    methods: {
      open (link) {
        this.$electron.shell.openExternal(link)
      }
    }
  }
</script>

<style>
  @import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');
</style>
