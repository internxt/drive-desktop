  <template>
  <hooper ref="carousel" @slide="updateCarousel" class="border h-full w-full rounded-3xl overflow-hidden focus:outline-none">
    <slide>
      <div class="flex flex-col items-center h-full relative">
        <div class="flex items-center h-32">
          <img src="../../assets/images/slide-1/internxt-name-logo.png" />
        </div>

        <h1 class="text-5xl text-center font-bold bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text">Welcome to Interxt Drive</h1>
        <p class="text-2xl text-center text-gray-800 font-bold w-5/6 px-12 mt-8">
          We have designed and deployed all the power of
          the world's only private and secure decentralized
          storage with a minimalist interface for ease of use
        </p>

        <input @click.prevent="slideNext" type="button" value="Start" class="text-2xl text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />

        <div class="flex items-center absolute top-0 right-0">
          <img src="../../assets/images/slide-1/top-right-image.png" />
        </div>

        <div class="flex items-center absolute bottom-0 left-0">
          <img src="../../assets/images/slide-1/bottom-left-image.png" />
        </div>
      </div>
    </slide>

    <!-- <slide>
      <div class="flex flex-col items-center h-full">
        <div class="flex items-end h-16">
          <img src="../../assets/images/slide-1/internxt-name-logo.png" />
        </div>

        <h1 class="text-5xl text-center font-bold mt-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text">
          Internxt Drive
        </h1>
        <p class="text-base text-center text-gray-700 font-bold w-5/6 px-16 mt-5">
          Before starting, let's do an initial set up of your application, so that you can
          choose the type of synchronization that best suits you.
        </p>

        <div class="flex flex-row w-full justify-center mt-8">
          <button class="flex flex-col items-start w-72 bg-white rounded-lg border-3 focus:outline-none ring ring-gray-300 focus:ring-blue-600 mr-4 p-4 relative overflow-hidden">
            <div class="absolute w-24 h-24 -top-16 -right-16 bg-blue-600 transform rotate-45" />
            <div class="absolute top-2 right-1.5 w-3">
              <img src="../../assets/images/slide-2/tick.png" />
            </div>

            <h2 class="text-left text-base text-blue-600 font-bold">Full sync</h2>
            <p class="text-left text-xs text-gray-700 mt-2">
              Select this sync method for a complete sync experience with your Desktop application.
            </p>

            <input type="button" value="Ok" class="absolute bottom-3 left-4 self-start bg-blue-600 px-3 py-1.5 mt-4 text-white text-xs font-thin rounded-md">
          </button>

          <button class="flex flex-col items-start w-72 h-36 bg-white rounded-lg border-3 focus:outline-none ring ring-gray-300 focus:ring-blue-600 mr-4 p-4 relative overflow-hidden">
            <div class="absolute w-24 h-24 -top-16 -right-16 bg-blue-600 transform rotate-45" />
            <div class="absolute top-2 right-1.5 w-3">
              <img src="../../assets/images/slide-2/tick.png" />
            </div>

            <h2 class="text-left text-base text-blue-600 font-bold">Upload only</h2>
            <p class="text-left text-xs text-gray-700 mt-2">
              Want to free up space on your device? Upload files to the cloud with a one-way upload mode.
            </p>

            <input type="button" value="Ok" class="absolute bottom-3 left-4 self-start bg-blue-600 px-3 py-1.5 mt-4 text-white text-xs font-thin rounded-md">
          </button>
        </div>
      </div>
    </slide> -->

    <slide>
      <div class="flex h-full">
        <div class="w-1/2 h-full">
          <img class="h-full" src="../../assets/images/slide-3/image.png" />
        </div>

        <div class="flex flex-col w-1/2 bg-white p-10 relative">
          <p class="text-xs text-purple-500 font-thin mt-4">DRIVE DESKTOP</p>

          <h1 class="text-4xl bg font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
            Experience Internxt like never before
          </h1>

          <div class="text-base text-gray-700 font-bold mt-6">
            Internxt's Drive Desktop app is incredibly powerful.
            Synchronize files with ease. Fast, Secure, Private.
            Quickly check the status of your sync from the tray
            icon's sync window.
          </div>

          <input @click.prevent="slidePrev" type="button" value="Previous" class="absolute bottom-8 left-12 text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
          <input @click.prevent="slideNext" type="button" value="Next" class="absolute bottom-8 right-12 text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
        </div>
      </div>
    </slide>

    <slide>
      <div class="flex h-full">
        <div class="flex items-center justify-center w-1/2 h-full">
          <div>
            <img class="h-full -mb-2 -ml-2" src="../../assets/images/slide-4/image.png" />
          </div>
        </div>

        <div class="flex flex-col w-1/2 bg-white p-10 relative">
          <p class="text-xs text-purple-500 font-thin mt-4">SIMPLE</p>

          <h1 class="text-4xl bg font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
            Securely sync your files in one simple,
            yet powerful app
          </h1>

          <div class="text-base text-gray-700 font-bold mt-6">
            Drive Desktop securely encrypts your files. It also cuts them
            into small pieces so that a server only holds an encrypted data shard.
            Maximum security in one simple, yet incredibly powerful app.
            Privacy like never before.
          </div>

          <input @click.prevent="slidePrev" type="button" value="Previous" class="absolute bottom-8 left-12 text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
          <input @click.prevent="slideNext" type="button" value="Next" class="absolute bottom-8 right-12 text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
        </div>
      </div>
    </slide>

    <slide>
      <div class="flex h-full relative">
        <div class="flex items-center justify-center w-1/2 h-full relative">
          <div class="mb-12 ml-8">
            <img class="h-full -mb-2 -ml-2" src="../../assets/images/slide-5/center-image.png" />
          </div>

          <div class="absolute right-12 bottom-44">
            <img src="../../assets/images/slide-5/sync-mode-image.png" />
          </div>
        </div>

        <div class="flex flex-col w-1/2 bg-white p-10 relative">
          <p class="text-xs text-purple-500 font-thin mt-4">CHOOSE YOUR FAVORITE SYNC MODE</p>

          <h1 class="text-4xl bg font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
            Configure your desired sync mode with ease
          </h1>

          <div class="text-base text-gray-700 font-bold mt-6">
            Full sync mode will allow you to fully synchronize your files both on the cloud and locally.
            Upload-only mode will allow you to back up your files on the cloud, without having to keep
            a local copy of them so that you can free up local storage space.
          </div>

          <input @click.prevent="slidePrev" type="button" value="Previous" class="absolute bottom-8 left-12 text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
          <input @click.prevent="slideNext" type="button" value="Next" class="absolute bottom-8 right-12 text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
        </div>

        <div>
          <img class="absolute bottom-0 left-0" src="../../assets/images/slide-5/bottom-left-image.png" />
        </div>
      </div>
    </slide>

    <slide>
      <div class="flex h-full relative">
        <div class="flex items-center justify-center w-1/2 h-full relative">
          <div class="mb-8 ml-8">
            <img class="h-full" src="../../assets/images/slide-6/image.png" />
          </div>
        </div>

        <div class="flex flex-col w-1/2 bg-white p-10 relative">
          <p class="text-xs text-purple-500 font-thin mt-4">FAST</p>

          <h1 class="text-4xl font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
            Securely synchronize all your files real fast.
          </h1>

          <div class="text-base text-gray-700 font-bold mt-6">
            No other service provides such protection for your personal data against third-parties.
            Client-side encrypted, fragmented, safe. Say hello to a new era of cloud storage.
            Simple, Fast, Secure, Private. Welcome to Internxt Drive.
          </div>

          <input @click.prevent="slidePrev" type="button" value="Previous" class="absolute bottom-8 left-12 text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
          <input @click.prevent="finishOnboarding" type="button" value="Get started!" class="absolute bottom-8 right-12 text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
        </div>
      </div>
    </slide>

    <hooper-pagination v-if="currentSlide !== 0" slot="hooper-addons"></hooper-pagination>
  </hooper>
</template>

<script>
// import PagesContentOnBoarding from './PagesContentOnBoarding'
import { Hooper, Slide, Pagination as HooperPagination } from 'hooper'
import './OnBoarding.scss'
import 'hooper/dist/hooper.css'
const remote = require('@electron/remote')

export default {
  data() {
    return {
      currentSlide: 0
    }
  },
  watch: {
    currentSlide () {
      this.$refs.carousel.slideTo(this.currentSlide)
    }
  },
  methods: {
    slideNext() {
      this.$refs.carousel.slideNext()
    },
    slidePrev() {
      this.$refs.carousel.slidePrev()
    },
    updateCarousel(payload) {
      this.currentSlide = payload.currentSlide
    },
    finishOnboarding() {
      // TODO
      const bounds = remote.getCurrentWindow().trayBounds
      remote.getCurrentWindow().setBounds({ width: 450, height: 360, x: bounds.x - 800, y: bounds.y })
      this.$router.push('/xcloud').catch(() => {})
    }
  },
  components: {
    Hooper,
    Slide,
    HooperPagination
  }
}
</script>


