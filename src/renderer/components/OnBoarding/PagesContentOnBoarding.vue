<template>
    <slither-slider 
        :options="{
          dots: true,
          numberOfSlides: [
            { number: 1, min: 0 },
            { number: 2, min: 780 }
          ]}">
        <div class="grid grid-cols-12">
            <div class="col-span-6">
                Image
            </div>
            <div class="col-span-6">
                <div>Full Sync Mode</div>
                <h1>Sync all your files from try icon and get feedback</h1>
                <div>Experience Internxt like never before Internxts Drive Desktop app is incredibly powerful. Synchronize files with ease. Fast, Secure, Private. Quickly check the status of your sync from the tray icons sync window.</div>
            </div>
        </div>

        <div class="grid grid-cols-12">
            <div class="col-span-6">
                Image
            </div>
            <div class="col-span-6">
                <div>Full Sync Mode</div>
                <h1>Sync all your files from try icon and get feedback</h1>
                <div>Experience Internxt like never before Internxts Drive Desktop app is incredibly powerful. Synchronize files with ease. Fast, Secure, Private. Quickly check the status of your sync from the tray icons sync window.</div>
            </div>
        </div>
    </slither-slider>


</template>

<script>
import SlitherSlider from 'slither-slider'

export default {
  name: 'PagesContentOnBoarding',
  data() {
    return {

    }
  },
  components: {
    SlitherSlider
  },
  methods: {

  },
  props: {
    media: {
      type: String,
      default: ''
    },
    minTitle: {
      type: String,
      default: 'Full Sync Mode'
    },

    mainTitle: {
      type: String,
      default: 'Sync all your files from try icon and get feedback'
    },
    bodyText: {
      type: String,
      default: 'Experience Internxt like never before Internxts Drive Desktop app is incredibly powerful. Synchronize files with ease. Fast, Secure, Private. Quickly check the status of your sync from the tray icons sync window.'
    }

  }
}
</script>
