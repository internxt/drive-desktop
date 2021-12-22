  <template>
  <hooper ref="carousel" @slide="updateCarousel" class="border w-full overflow-hidden focus:outline-none" style="height: 100% !important">
    <slide>
      <div class="h-full image-slide-1">
        <div class="grid grid-cols-12">
          <div class="p-16 col-span-8">
              <img class="mb-16" src="../../assets/images/slide-1/internxt-brand.svg" />
              <h1 class="mb-10 text-4xl text-left font-bold bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900 text-transparent bg-clip-text">Welcome<br /> to Internxt Drive</h1>
              <p class="mb-16 text-base text-left text-gray-800 font-bold">
                We have designed and deployed all the power of
                the world's only private and secure decentralized
                storage with a minimalist interface for ease of use
              </p>
              <input @click.prevent="slideNext" type="button" value="Start" class="text-left text-xl text-blue-600 font-bold bg-transparent cursor-pointer focus:outline-none" />
          </div>

          <div class="col-span-4"></div>
        </div>
        </div>
    </slide>

    <slide>

      <div>
        <h1 class="mt-10 text-4xl text-center font-bold bg-gradient-to-r from-blue-700 via-pink-500 text-transparent bg-clip-text">Powerfull sync</h1>
        <h2 class="text-xl text-center font-bold bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900 text-transparent bg-clip-text">Six amazing features</h2>
        <div class="grid grid-cols-12">

          <div class="col-span-3 mt-6">

            <div class="flex pl-10 mb-4">
              <div class="mr-6">
                <div class="font-bold mb-1">Activity monitor</div>
                <div class="text-xs">Check how many files have already been synchronized, right from your Desktop app</div>
              </div>
              <p class="text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">1</p>
            </div>

            <div class="flex pl-10 mb-4">
              <div class="mr-6">
                <div class="font-bold mb-1">Start and Pause</div>
                <div class="text-xs">Are you in a rush? Instantly Start and Pause your sync at any time</div>
              </div>
              <p class="text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">2</p>
            </div>

            <div class="flex pl-10">
              <div class="mr-6">
                <div class="font-bold mb-1">File sync status</div>
                <div class="text-xs">Take a look at how fast your files securely synchronize with the cloud</div>
              </div>
              <p class="text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">3</p>
            </div>

          </div>

          <div class="col-span-6 center-image"><img class="mt-6" src="../../assets/images/slide-1-2/desktop-app.svg" /></div>

          <div class="col-span-3 mt-6">
              <div class="flex pr-10 mb-4">
                <p class="mr-6 text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">4</p>
                <div>
                  <div class="font-bold mb-1">Sync progress</div>
                  <div class="text-xs">Experience speed & security by visualising the overall sync status of the app</div>
                </div>
              </div>

              <div class="flex pr-10 mb-4">
                <p class="mr-6 text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">5</p>
                <div>
                  <div class="font-bold mb-1">Customize your app</div>
                  <div class="text-xs">Easily set up your desktop app. Switch sync modes, change your sync folder & more</div>
                </div>
              </div>

              <div class="flex pr-10">
                <p class="mr-6 text-transparent bg-clip-text text-5xl text-left bg-gradient-to-r from-blue-700 via-pink-500 to-purple-900">6</p>
                <div>
                  <div class="font-bold mb-1">Upgrade any time</div>
                  <div class="text-xs">Need more storage space? Upgrade at any time with a 30-day money-back guarantee!</div>
                </div>
              </div>
          </div>
        </div>
      </div>

    </slide>

    <slide>
        <div class="grid grid-cols-12">
          <div class="col-span-6 w-auto slide-3">
            <img src="../../assets/images/slide-2/internxt-like-never-before.png" />
          </div>
          <div class="col-span-6">

            <div class="px-16 py-12 center-content-slide">
              <div class="mt-6">
                <p class="text-xs text-purple-500 font-thin mt-4">DRIVE DESKTOP</p>
                <h1 class="text-4xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
                  Experience<br /> Internxt like never before
                </h1>
                <div class="text-base text-gray-700 font-bold mt-6">
                  Internxt's Drive Desktop app is incredibly powerful.
                  Synchronize files with ease. Fast, Secure, Private.
                  Quickly check the status of your sync from the tray
                  icon's sync window.
                </div>
              </div>

              <div class="flex justify-between">
                <input @click.prevent="slidePrev" type="button" value="Previous" class="text-base text-gray-400 font-bold bg-transparent cursor-pointer focus:outline-none" />
                <input @click.prevent="slideNext" type="button" value="Next" class="text-base text-blue-600 font-bold bg-transparent cursor-pointer focus:outline-none" />
              </div>
            </div>

          </div>
        </div>
    </slide>

    <slide>
      <div class="grid grid-cols-12">
        <div class="col-span-6 p-14">
            <img src="../../assets/images/slide-4/4-securely-sync.svg" />
        </div>
        <div class="col-span-6">
          <div class="px-16 py-12 center-content-slide">
            <p class="text-xs text-purple-500 font-thin mt-4">SIMPLE</p>
            <h1 class="text-4xl bg bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
              Securely sync your files in one simple,
              yet powerful app
            </h1>
            <div class="text-base text-gray-700 font-bold mt-6">
              Drive Desktop securely encrypts your files. It also cuts them
              into small pieces so that a server only holds an encrypted data shard.
              Maximum security in one simple. Privacy like never before.
            </div>

            <div class="flex justify-between">
              <input @click.prevent="slidePrev" type="button" value="Previous" class="text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
              <input @click.prevent="slideNext" type="button" value="Next" class="text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
            </div>
          </div>

        </div>
      </div>
    </slide>

    <slide>
      <div class="grid grid-cols-12">
        <div class="col-span-6 p-16">
          <img class="m-auto" src="../../assets/images/slide-5/5-configure-your-sync.svg" />
        </div>
        <div class="col-span-6">
          <div class="px-16 py-12 center-content-slide">
            <p class="text-xs text-purple-500 font-thin mt-4">CHOOSE YOUR FAVORITE SYNC MODE</p>
            <h1 class="text-4xl bg bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
              Configure your desired sync mode with ease
            </h1>
            <div class="text-base text-gray-700 font-bold mt-6">
              Full sync mode will allow you to fully synchronize your files both on the cloud and locally.
              Upload-only mode will allow you to back up your files on the cloud, without having to keep
              a local copy of them.
            </div>
            <div class="flex justify-between">
              <input @click.prevent="slidePrev" type="button" value="Previous" class="text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
              <input @click.prevent="slideNext" type="button" value="Next" class="text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
            </div>
          </div>

        </div>
      </div>
    </slide>

    <slide>

      <div class="grid grid-cols-12">
        <div class="col-span-6 p-16">
          <img src="../../assets/images/slide-6/6-synchronize-your-files.svg" />
        </div>
        <div class="col-span-6">
          <div class="px-16 py-12 center-content-slide">
            <p class="text-xs text-purple-500 font-thin mt-4">FAST</p>
            <h1 class="text-4xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-400 text-transparent bg-clip-text mt-2">
              Securely synchronize all your files real fast.
            </h1>
            <div class="text-base text-gray-700 font-bold mt-6">
              No other service provides such protection for your personal data against third-parties.
              Client-side encrypted, fragmented, Simple, Fast, Secure, Private. Welcome to Internxt Drive.
            </div>

            <div class="flex justify-between">
              <input @click.prevent="slidePrev" type="button" value="Previous" class="text-base text-gray-400 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
              <input @click.prevent="finishOnboarding" type="button" value="Get started!" class="text-base text-blue-600 font-bold mt-16 bg-transparent cursor-pointer focus:outline-none" />
            </div>
          </div>
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
  beforeCreate() {
    // remote.getCurrentWindow().center()
    remote.app.emit('enter-onboarding', true)
    remote.app.emit('window-show')
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
      remote.app.emit('window-pushed-to', '/xcloud')
      this.$router.push('/xcloud').catch(() => {})
      // remote.app.emit('enter-onboarding', false)
    }
  },
  components: {
    Hooper,
    Slide,
    HooperPagination
  }
}
</script>


