<template>
  <div class="window flex flex-row w-full h-full text-neutral-500">

    <div class="relative flex flex-row w-full h-full p-8">

      <div class="relative flex flex-col h-full flex-grow -ml-8 pointer-events-none">
        <transition
          enter-active-class="transition-opacity duration-250"
          enter-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-250 delay-500"
          leave-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <img v-if="(slide === 0) && (getOS() === 'mac')" key="image-0" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac.png" />
          <img v-if="(slide === 0) && (getOS() === 'windows')" key="image-0" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac.png" />
          <img v-if="(slide === 1) && (getOS() === 'mac')" key="image-1" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-finder-widget.png" />
          <img v-if="(slide === 1) && (getOS() === 'windows')" key="image-1" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-finder-widget.png" />
        </transition>
      </div>

      <div v-if="slide === 0" key="slide-0" class="flex flex-col flex-shrink-0 items-center justify-center w-96 h-full space-y-6">

        <div class="flex flex-col items-center space-y-3">
          <img src="../../assets/images/onboarding/logo.svg" />
        
          <div class="flex flex-col items-center max-w-full">
            <h3 class="text-2xl font-semibold tracking-wide text-neutral-900 text-center">Welcome to Internxt, {{this.userName}}!</h3>
            <p>Let’s get everything on point together.</p>
          </div>
        </div>

        <button
          @click="nextSlide()"
          class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
        >
          Get started
        </button>
      </div>

      <div v-if="slide === 1" key="slide-1" class="flex flex-col flex-shrink-0 items-center justify-center w-96 h-full space-y-6">

        <div class="flex flex-col items-center space-y-6">
          <div class="flex flex-col items-center">
            <img src="../../assets/images/onboarding/folder.svg" />
            <p class="font-medium text-neutral-900">Internxt</p>
          </div>
        
          <div class="relative w-full">
            Internxt is a folder on your computer. It works<br />
            like your Documents or Photos folder. The files<br />
            you put in there are automatically synced for<br />
            you on <a class="text-blue-600 cursor-pointer" @click="openDriveInWebBrowser()">drive.internxt.com</a>.
          </div>
        </div>

        <button
          @click="prevSlide()"
          class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
        >
          Finish
        </button>
      </div>

    </div>

  </div>
</template>

<script>
import database from '../../../database'
const remote = require('@electron/remote')

export default {
  data() {
    return {
      slide: 0,
      forward: true,
      userName: null
    }
  },
  beforeCreate() {
    // remote.getCurrentWindow().center()
    remote.app.emit('enter-onboarding', true)
    remote.app.emit('window-show')

    database
      .Get('xUser')
      .then((xUser) => {
        this.userName = xUser.user.name
      })
      .catch((err) => {
        console.log('[Onboarding] Cannot get user name: ', err.message)
      })
  },
  methods: {
    getOS() {
      const platform = window.navigator.platform
      const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
      const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']

      if (macosPlatforms.indexOf(platform) !== -1) {
        return 'mac'
      } else if (windowsPlatforms.indexOf(platform) !== -1) {
        return 'windows'
      } else if (/Linux/.test(platform)) {
        return 'linux'
      }
      return null
    },
    nextSlide() {
      this.slide = this.slide + 1
      this.forward = true
    },
    prevSlide() {
      if (this.slide > 0) this.slide = this.slide - 1
      this.forward = false
    },
    finishOnboarding() {
      remote.app.emit('window-pushed-to', '/xcloud')
      this.$router.push('/xcloud').catch(() => {})
      // remote.app.emit('enter-onboarding', false)
    },
    openDriveInWebBrowser() {
      remote.shell.openExternal('https://drive.internxt.com/app')
    }
  }
}
</script>


