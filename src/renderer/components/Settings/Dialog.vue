<template>
  <div class="min-h-full min-w-full top-0 left-0 absolute z-50 flex justify-center items-center" style="background-color: rgba(0,0,0,0.3)">
    <div style="border-radius: 8px" class="bg-white w-8/12 p-4 flex flex-col justify-between items-stretch text-center">
    
      <h1 class="font-semibold text-gray-800">{{details.title}}</h1>
      <p class="text-sm text-gray-500 mt-2">{{details.description}}</p>
      <div class="flex items-center justify-center space-x-4 mt-6">
        <Button v-for="(answer,i) in details.answers" :key="i" :fluid="true" :state="answer.state" @click="() => emitAnswer(i)"> {{answer.text}}</Button>
      </div>
    </div>
  </div>
</template>

<script>
import Button from '../Button/Button.vue'

export default {
  components: {
    Button
  },
  computed: {
    details() {
      return this.$store.state.ui.settingsDialog
    }
  },
  methods: {
    emitAnswer(value) {
      const {callback} = this.details
      this.$store.originalDispatch('hideSettingsDialog')
      callback(value)
    }
  }
}
</script>