  <template>
    <hooper>

        <slide>
            <div class="grid grid-cols-12 h-800">
                <div class="col-span-6">
                    <img src="../../assets/images/Full-sync.png" />
                </div>
                <div class="col-span-6">
                    <div class="items-center">
                        <div>Full Sync Mode</div>
                        <h1 class="text-4xl text-gradient font-extrabold">Sync all your files from try icon and get feedback</h1>
                        <div class="text-lg">Experience Internxt like never before Internxts Drive Desktop app is incredibly powerful. Synchronize files with ease. Fast, Secure, Private. Quickly check the status of your sync from the tray icons sync window.</div>
                    </div>
                </div>
            </div>
        </slide>

        <slide>
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
        </slide>
        <hooper-pagination slot="hooper-addons"></hooper-pagination>
  </hooper>
</template>
  
<script>
// import PagesContentOnBoarding from './PagesContentOnBoarding'
import { Hooper, Slide, Pagination as HooperPagination } from 'hooper'
import './OnBoarding.scss'
import 'hooper/dist/hooper.css'

export default {
  data() {
    return {
      hooperSettings: {
        itemsToShow: 2,
        centerMode: true
      }
    }
  },
  components: {
    Hooper,
    Slide,
    HooperPagination
  }
}
</script>


