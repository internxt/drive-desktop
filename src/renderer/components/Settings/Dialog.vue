<template>
  <div class="min-h-full min-w-full top-0 left-0 absolute z-50 flex justify-center items-center" style="background-color: rgba(0,0,0,0.3)">
    <div style="border-radius: 8px" class="bg-white p-4 flex flex-col justify-between items-stretch text-center w-80">
    
      <h1 class="font-semibold text-gray-800">{{details.title}}</h1>
      <p class="text-sm text-gray-500 mt-2">{{details.description}}</p>
      <div v-if="details.checkbox" class="mt-4 mx-auto">
        <checkbox class="text-gray-800" :label="details.checkbox" @click.native="checkboxValue = !checkboxValue"/> 
      </div>
      <div class="flex items-center justify-center mt-6" :class="{'flex-col space-y-2': details.buttonsInColumn, 'space-x-4': !details.buttonsInColumn}">
        <Button v-for="(answer,i) in details.answers" :key="i" :fluid="true" :state="answer.state" @click="() => emitAnswer(i)"> {{answer.text}}</Button>
      </div>
    </div>
  </div>
</template>

<script>
import Button from '../Button/Button.vue'
import Checkbox from '../Icons/Checkbox.vue'

export default {
  components: {
    Button,
    Checkbox
  },
  data() {
    return {
      checkboxValue: false
    }
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
      callback(value, this.checkboxValue)
    }
  }
}
</script>