<template>
  <div class="flex items-center cursor-pointer" :class="state">
    <svg
      @click="!disabled ? changeState() : null"
      :width="width"
      :height="height"
      viewBox="0 0 16 16"
      fill="none"
      class="mr-2"
      xmlns="http://www.w3.org/2000/svg">
      <rect v-if="state === 'unchecked'" x="0.75" y="0.75" width="14.5" height="14.5" rx="2.25" fill="white" stroke="#42526E" stroke-width="2"/>
      <rect v-if="state === 'indeterminate' || state === 'checked'" x="0.5" y="0.5" width="15" height="15" rx="2.5" fill="#0F62FE" stroke="#0F62FE"/>
      <path v-if="state === 'indeterminate'" d="M12 7H4C3.73478 7 3.48043 7.10536 3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8C3 8.26522 3.10536 8.51957 3.29289 8.70711C3.48043 8.89464 3.73478 9 4 9H12C12.2652 9 12.5196 8.89464 12.7071 8.70711C12.8946 8.51957 13 8.26522 13 8C13 7.73478 12.8946 7.48043 12.7071 7.29289C12.5196 7.10536 12.2652 7 12 7Z" fill="white"/>
      <path v-if="state === 'checked'" d="M12.9089 4.86926C12.8441 4.80507 12.7669 4.75412 12.682 4.71935C12.597 4.68459 12.5058 4.66669 12.4138 4.66669C12.3217 4.66669 12.2306 4.68459 12.1456 4.71935C12.0606 4.75412 11.9835 4.80507 11.9187 4.86926L6.72368 9.97805L4.54107 7.8277C4.47377 7.76385 4.39431 7.71364 4.30725 7.67994C4.22019 7.64625 4.12722 7.62972 4.03365 7.63131C3.94009 7.6329 3.84775 7.65258 3.76193 7.68921C3.6761 7.72584 3.59847 7.77872 3.53345 7.84482C3.46843 7.91092 3.41731 7.98895 3.383 8.07445C3.34869 8.15996 3.33186 8.25126 3.33348 8.34315C3.3351 8.43504 3.35513 8.52572 3.39243 8.61001C3.42974 8.69429 3.48358 8.77054 3.55088 8.83439L6.22858 11.4641C6.29341 11.5283 6.37053 11.5793 6.45551 11.614C6.54048 11.6488 6.63162 11.6667 6.72368 11.6667C6.81573 11.6667 6.90688 11.6488 6.99185 11.614C7.07683 11.5793 7.15395 11.5283 7.21877 11.4641L12.9089 5.87595C12.9797 5.81182 13.0362 5.73399 13.0748 5.64736C13.1134 5.56073 13.1334 5.46718 13.1334 5.3726C13.1334 5.27803 13.1134 5.18448 13.0748 5.09785C13.0362 5.01122 12.9797 4.93339 12.9089 4.86926Z" fill="white"/>
    </svg>
    <span @click="!disabled ? changeState() : null">{{label}}</span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      width: '16',
      height: '16',
      state: 'unchecked'
    }
  },
  props: {
    label: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    forceStatus: {
      type: String,
      default: ''
    }
  },
  methods: {
    changeState() {
      switch (this.state) {
        case 'unchecked':
          this.state = 'checked'
          break
        case 'checked':
          this.state = 'unchecked'
          break
        case 'indeterminate':
          this.state = 'unchecked'
          break
      }
    }
  },
  created() {
    this.state = this.forceStatus ? this.forceStatus : 'unchecked'
  },
  name: 'Checkbox'
}
</script>