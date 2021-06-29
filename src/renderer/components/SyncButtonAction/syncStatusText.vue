<template>
<div class="text-gray-500 select-none" :class="syncState === 'pending' ? 'animate-pulse' : null">
  <div>{{msg.line1}}</div>
  <div class="flex">{{msg.line2}}</div>
</div>
</template>

<script>

export default {
  props: {
    syncState: {
      type: String
    },
    msg: {
      type: Object
    }
  }
}
</script>
