<template>
  <div
    v-if="!widgetTransition"
    class="window flex flex-row w-full h-full text-neutral-500 px-8 py-12"
    style="-webkit-app-region: drag"
  >
    <div
      class="relative flex flex-row justify-end w-full h-full"
      style="-webkit-app-region: no-drag"
    >
      <div
        v-bind:class="
          `relative flex flex-col flex-grow h-full -ml-8 pointer-events-none transition-all duration-500 delay-100 ${slide ===
            0 && 'mr-8'}`
        "
      >
        <transition
          enter-active-class="transition-all duration-500 delay-0"
          enter-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all ease-out duration-500 delay-0"
          leave-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <img
            v-if="slide === 1"
            key="image-1"
            class="absolute object-right object-cover h-full"
            src="../../assets/images/onboarding/mac-finder-widget.png"
          />
          <img
            v-if="slide === 2"
            key="image-2"
            class="absolute widget object-right object-cover h-full origin-top-right"
            src="../../assets/images/onboarding/widget.png"
          />
        </transition>
      </div>

      <div
        v-bind:class="
          `relative flex flex-col items-center transition-all ease-in-out duration-500 delay-100 ${
            slide === 0 ? 'w-full' : 'w-96'
          }`
        "
      >
        <transition
          enter-active-class="transition-all duration-200 delay-300"
          enter-class="transform -translate-y-1.5 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition-all ease-out duration-300"
          leave-class="transform translate-y-0 opacity-100"
          leave-to-class="transform translate-y-2 opacity-0"
        >
          <div
            v-if="slide === 0"
            key="slide-0"
            class="absolute flex flex-col w-full h-full flex-shrink-0 items-center justify-center space-y-6"
          >
            <div class="flex flex-col items-center space-y-6">
              <img src="../../assets/images/onboarding/logo.svg" />

              <div class="flex flex-col items-center text-center max-w-full">
                <h3
                  class="text-2xl font-semibold tracking-wide text-neutral-900 mb-2"
                >
                  Welcome to Internxt{{ userName }}!
                </h3>
                <p>Client-side encrypted, fragmented, simple, fast, secure and private.</p>
                <p>Discover the brand new features of Internxt Drive.</p>
              </div>
            </div>

            <button
              @click="nextSlide"
              class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
            >
              Let's go!
            </button>
          </div>

          <div
            v-if="slide === 1"
            key="slide-1"
            class="absolute flex flex-col w-96 h-full flex-shrink-0 items-center justify-between space-y-6 py-8"
          >
            <div class="flex flex-col items-center space-y-6">
              <h3
                class="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900"
              >
                Sync Folder
              </h3>

              <ul class="relative list-disc flex flex-col items-left space-y-3 pl-4 text-base text-neutral-500 w-full max-w-xs">
                <li>
                  You'll find a new folder where all your data from the Internxt cloud will be accessible.
                </li>

                <li>
                  Simply drag and drop items into this folder and press the play button to upload them.
                </li>

                <li>
                  Press the play button to keep this folder synchronized with other devices.
                </li>

                <li>
                  Choose sync folder location from settings.
                </li>
              </ul>
            </div>

            <button
              @click="nextSlide"
              class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
            >
              Next
            </button>
          </div>

          <div
            v-if="slide === 2"
            key="slide-2"
            class="absolute flex flex-col w-96 h-full flex-shrink-0 items-center justify-between space-y-6 py-8"
          >
            <div class="flex flex-col items-center space-y-6">
              <h3
                class="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900"
              >
                Internxt Widget
              </h3>

              <ul class="relative list-disc flex flex-col items-left space-y-3 pl-4 text-base text-neutral-500 w-full max-w-xs">
                <li>
                  Quick access to <a class="text-blue-600 underline cursor-pointer" @click="openLink('https://drive.internxt.com/app')">drive.internxt.com</a>.
                </li>

                <li>
                  Update your plan, device name or configure backups from the settings menu.
                </li>

                <li>
                  View the state of your data transfer.
                </li>

                <li>
                  Check the status of your sync and backups processes.
                </li>

                <li>
                  Start or stop your sync process anytime.
                </li>
              </ul>
            </div>

            <button
              @click="finishOnboarding"
              class="flex flex-row px-3 py-1 text-base bg-white rounded-lg border border-gray-100 shadow-sm"
            >
              Finish
            </button>
          </div>
        </transition>

        <div
          v-bind:class="
            `absolute bottom-0 left-0 w-full h-auto flex flex-col justify-center items-center transition-opacity ease-in-out duration-500 ${
              slide >= 1 ? 'opacity-100' : 'opacity-0'
            } opacity-0 hidden pointer-events-none`
          "
        >
          <div
            @mouseover="stepsHover = true"
            @mouseleave="stepsHover = false"
            v-bind:class="
              `flex flex-row p-1 space-x-1.5 rounded-full transition-all ease-out duration-200 transform ${stepsHover &&
                'bg-white shadow-md scale-150'}`
            "
          >
            <div
              @click="() => goToSlide(1)"
              v-bind:class="
                `flex h-1.5 rounded-full transition-all ease-in-out duration-300 ${
                  slide === 1 ? 'w-4' : 'w-1.5'
                } ${slide >= 1 ? 'bg-gray-400 bg-opacity-75' : 'bg-gray-300'}`
              "
            ></div>
            <div
              @click="() => goToSlide(2)"
              v-bind:class="
                `flex h-1.5 rounded-full transition-all ease-in-out duration-300 ${
                  slide === 2 ? 'w-4' : 'w-1.5'
                } ${slide >= 2 ? 'bg-gray-400 bg-opacity-75' : 'bg-gray-300'}`
              "
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import './OnBoarding.scss'
import * as Auth from '../../../main/auth'
const remote = require('@electron/remote')

export default {
  data() {
    return {
      slide: 0,
      forward: true,
      user: null,
      stepsHover: false,
      widgetTransition: false
    }
  },
  beforeCreate() {
    remote.getCurrentWindow().center()
    remote.app.emit('enter-onboarding', true)
    remote.app.emit('window-show')
  },
  mounted() {
    this.user = Auth.getUser()
  },
  methods: {
    getOS() {
      switch (process.platform) {
        case 'darwin':
          return 'mac'
        case 'win32':
          return 'windows'
        default:
          return 'linux'
      }
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
      remote.app.emit('enter-onboarding', false)
      remote.app.emit('show-main-windows')
    },
    openLink(link) {
      remote.shell.openExternal(link)
    }
  },
  computed: {
    userName() {
      if (!this.user) {
        return ''
      }
      return ', ' + this.user.name
    }
  }
}
</script>
