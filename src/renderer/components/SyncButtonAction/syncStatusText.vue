<template>
<div class="text-gray-500 select-none">
  <div>{{msg.line1}}</div>
  <div class="flex">{{msg.line2}}</div>
</div>
</template>

<script>

export default {
  props: {
    msg: {
      type: Object
    }
  }
}
</script>
