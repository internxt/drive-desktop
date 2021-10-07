<template>
  <div class="px-4 py-3 bg-white" :class="{'hidden': online}">
    <div class="rounded-lg border bg-gray-100 text-gray-500 py-3 px-4 flex items-stretch justify-between">
      <img class="mr-3 flex-shrink-0 filter grayscale opacity-70" src="../../assets/icons/apple/no-signal.svg" width="35px" height="35px"/>
      <p class="text-sm mb-0" >You are offline, changes will be synced when you go back online</p>
    </div>
  </div>	
</template>

<script>
export default {
  data() {
    return {
      online: navigator.onLine
    }
  },
  mounted() {
    window.addEventListener('online', this.setOnline)
    window.addEventListener('offline', this.setOnline)
  },
  methods: {
    setOnline() {
      this.online = navigator.onLine
    }
  }
}
</script>