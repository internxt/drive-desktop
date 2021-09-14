<template>
  
            <div
            :style="`height:${size}px;width: ${size}px; font-size: ${fontSize}px`"
              class="
                flex
                justify-center
                items-center
                rounded-full
                text-blue-600
                bg-blue-200
                font-semibold
              "
            >
              <p>
                {{ nameToInitials(userFullname).toUpperCase() }}
              </p>
            </div>
</template>

<script>
export default {
  props: [ 'size', 'userFullname' ],
  methods: {
    nameToInitials(fullName) {
      const namesArray = fullName.trim().split(' ')
      if (namesArray.length === 1) return `${namesArray[0].charAt(0)}`
      else return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
    }
  },
  computed: {
    fontSize() {
      return parseInt(this.size) / 2
    }
  }
}
</script>