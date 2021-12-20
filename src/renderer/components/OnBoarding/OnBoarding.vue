<template>
  <div v-if="!widgetTransition" class="window flex flex-row w-full h-full text-neutral-500">

    <div class="relative flex flex-row justify-end w-full h-full px-8 py-12">

      <div v-bind:class="`relative flex flex-col flex-grow h-full -ml-8 pointer-events-none transition-all duration-500 delay-100 ${slide === 0 && 'mr-8'}`">
        <transition
          enter-active-class="transition-all duration-500"
          enter-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all ease-out duration-500 delay-1000"
          leave-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <img v-if="(slide === 1) && (getOS() === 'mac' || getOS() === 'linux')" key="image-mac-1" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-finder-widget.png" />
          <img v-if="(slide === 1) && (getOS() === 'windows')" key="image-windows-1" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-finder-widget.png" />
          <img v-if="(slide === 2) && (getOS() === 'mac' || getOS() === 'linux')" key="image-mac-2" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-blog.png" />
          <img v-if="(slide === 2) && (getOS() === 'windows')" key="image-windows-2" class="absolute object-right object-cover h-full" src="../../assets/images/onboarding/mac-blog.png" />
        </transition>
      </div>

      <div v-bind:class="`relative flex flex-col items-center transition-all ease-in-out duration-500 delay-100 ${slide === 0 ? 'w-full' : 'w-96'}`">

        <transition
          enter-active-class="transition-all duration-200 delay-300"
          enter-class="transform -translate-y-1.5 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition-all ease-out duration-300"
          leave-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0"
        >
          <div v-if="slide === 0" key="slide-0" class="absolute flex flex-col w-96 h-full flex-shrink-0 items-center justify-center space-y-6">
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
              Let's go!
            </button>
          </div>

          <div v-if="slide === 1" key="slide-1" class="absolute flex flex-col w-96 h-full flex-shrink-0 items-center justify-center space-y-6">
            <div class="flex flex-col items-center space-y-6">
              <div class="flex flex-col items-center space-y-0.5">
                <img class="pointer-events-none" src="../../assets/images/onboarding/folder.svg" />
                <p class="font-medium text-neutral-900">Internxt</p>
              </div>
            
              <div class="relative text-justify w-full max-w-xs">
                Internxt is a folder on your computer. It works
                like your Documents or Photos folder. The files
                you put in there are automatically synced for you
                on <a class="text-blue-600 underline cursor-pointer" @click="openLink('https://drive.internxt.com/app')">drive.internxt.com</a>.
              </div>
            </div>

            <button
              @click="nextSlide()"
              class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
            >
              Next
            </button>
          </div>

          <div v-if="slide === 2" key="slide-2" class="absolute flex flex-col w-full h-full flex-shrink-0 items-center justify-center space-y-6">

            <div class="relative text-justify w-full max-w-xs">
              To discover all the new release features, check out our
              blog post <a class="text-blue-600 underline cursor-pointer" @click="openLink('https://blog.internxt.com/')">here</a>.
            </div>

            <button
              @click="finishOnboarding()"
              class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
            >
              Cool, open the widget
            </button>
          </div>

        </transition>

        <div v-bind:class="`absolute bottom-0 left-0 w-full h-auto flex flex-col justify-center items-center transition-opacity ease-in-out duration-500 ${slide >= 1 ? 'opacity-100' : 'opacity-0'} opacity-0 hidden pointer-events-none`">
          <div @mouseover="stepsHover=true" @mouseleave="stepsHover=false" v-bind:class="`flex flex-row p-1 space-x-1.5 rounded-full transition-all ease-out duration-200 transform ${stepsHover && 'bg-white shadow-md scale-150'}`">
            <div @click="goToSlide(1)" v-bind:class="`flex h-1.5 rounded-full transition-all ease-in-out duration-300 ${slide === 1 ? 'w-4' : 'w-1.5'} ${slide >= 1 ? 'bg-gray-400 bg-opacity-75' : 'bg-gray-300'}`"></div>
            <div @click="goToSlide(2)" v-bind:class="`flex h-1.5 rounded-full transition-all ease-in-out duration-300 ${slide === 2 ? 'w-4' : 'w-1.5'} ${slide >= 2 ? 'bg-gray-400 bg-opacity-75' : 'bg-gray-300'}`"></div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script>
// import database from '../../../database'
const remote = require('@electron/remote')

export default {
  data() {
    return {
      slide: 0,
      forward: true,
      userName: null,
      stepsHover: false,
      widgetTransition: false
    }
  },
  beforeCreate() {
    remote.getCurrentWindow().center()
    remote.app.emit('enter-onboarding', true)
    remote.app.emit('window-show')

    // Database
    //   .Get('xUser')
    //   .then((xUser) => {
    //     this.userName = xUser.user.name
    //   })
    //   .catch((err) => {
    //     console.log('[Onboarding] Cannot get user name: ', err.message)
    //   })
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
      this.forward = true
      this.slide = this.slide + 1
    },
    prevSlide() {
      this.forward = false
      if (this.slide > 0) this.slide = this.slide - 1
    },
    goToSlide(slide) {
      if (this.slide !== slide) {
        this.forward = this.slide < slide
        this.slide = slide
      }
    },
    finishOnboarding() {
      this.widgetTransition = true
      remote.app.emit('close-onboarding')
      remote.app.emit('window-pushed-to', '/xcloud')
      this.$router.push('/xcloud').catch(() => {})
      remote.app.emit('enter-onboarding', false)
    },
    openLink(link) {
      remote.shell.openExternal(link)
    }
  }
}
</script>


