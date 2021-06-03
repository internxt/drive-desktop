<template>
    <div class="bg-white rounded-t-2xl p-4">
        <div class="subTitle font-semibold mb-3">File status</div>
        <ul>
            <div class="mb-1 flex">
                <UilFileCheckAlt class="text-2xl mr-3 fill-current text-green-500" />
                <div>
                    <div>Name of file</div>
                    <div>File status: Success</div>
                </div>
            </div>

            <div class="mb-1 flex">
                <UilFileUpload class="text-2xl mr-3 fill-current text-gray-300" />
                <div>
                    <div>Name of file</div>
                    <div>File status: Pending</div>
                </div>
            </div>

            <div class="mb-1 flex">
                <UilFileExclamation class="text-2xl mr-3 fill-current text-red-500" />
                <div>
                    <div>Name of file</div>
                    <div>File status: Error</div>
                </div>
            </div>

            <!-- <div class="mb-1 flex">
                <UilFileBlank class="text-2xl mr-3 fill-current text-blue-600" />
                <div>
                    <div>Name of file</div>
                    <div>File status: Last sync</div>
                </div>
            </div> -->
        </ul>
    </div>
</template>
<script>
import { UilFileCheckAlt, UilFileUpload, UilFileExclamation, UilFileBlank } from '@iconscout/vue-unicons'

export default ({
  methods: {
    debug() {
      // console.log(appName)
    }
  },
  name: 'FileStatus',
  props: {

  },
  components: {
    UilFileCheckAlt,
    UilFileUpload,
    UilFileExclamation,
    UilFileBlank
  }
})
</script>
