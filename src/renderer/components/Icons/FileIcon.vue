<template>
  <div>

    <!-- Default file -->
    <svg
      v-if="icon===''||icon==='file'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M6 32H26C27.1046 32 28 31.1046 28 30V8L20 0H6C4.89543 0 4 0.895431 4 2V30C4 31.1046 4.89543 32 6 32Z" fill="#EBECF0"/>
      <path d="M22.4849 7.21213L28 8L20 0L20.7879 5.51508C20.9136 6.39503 21.605 7.08642 22.4849 7.21213Z" fill="#B3BAC5"/>
    </svg>

    <!-- Folder -->
    <svg
      v-if="icon==='folder'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0)">
      <path d="M0.000244141 3C0.000244141 1.34314 1.34339 0 3.00024 0H8C11.3684 0 11.7895 3 16 3H29.0002C30.6571 3 32.0002 4.34315 32.0002 6V24C32.0002 25.6568 30.6571 27 29.0002 27H3.00024C1.34339 27 0.000244141 25.6568 0.000244141 24V3Z" fill="#52AFE0"/>
      <path d="M0.000244141 3C0.000244141 1.34314 1.34339 0 3.00024 0H8C11.3684 0 11.7895 3 16 3H29.0002C30.6571 3 32.0002 4.34315 32.0002 6V24C32.0002 25.6568 30.6571 27 29.0002 27H3.00024C1.34339 27 0.000244141 25.6568 0.000244141 24V3Z" fill="url(#paint0_linear)" fill-opacity="0.2"/>
      <g filter="url(#filter0_i)">
      <path d="M2.28882e-05 23.9999V10C2.28882e-05 8.34315 1.34317 7 3.00002 7L29 7C30.6569 6.99999 32 8.34314 32 10V23.9999C32 25.6568 30.6569 26.9999 29 26.9999H3.00002C1.34317 26.9999 2.28882e-05 25.6568 2.28882e-05 23.9999Z" fill="#73D0FA"/>
      <path d="M2.28882e-05 23.9999V10C2.28882e-05 8.34315 1.34317 7 3.00002 7L29 7C30.6569 6.99999 32 8.34314 32 10V23.9999C32 25.6568 30.6569 26.9999 29 26.9999H3.00002C1.34317 26.9999 2.28882e-05 25.6568 2.28882e-05 23.9999Z" fill="url(#paint1_radial)" fill-opacity="0.16"/>
      </g>
      </g>
      <defs>
      <filter id="filter0_i" x="0" y="5" width="32" height="22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dy="-2"/>
      <feGaussianBlur stdDeviation="1"/>
      <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.321569 0 0 0 0 0.686275 0 0 0 0 0.878431 0 0 0 0.32 0"/>
      <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
      </filter>
      <linearGradient id="paint0_linear" x1="16" y1="5" x2="16" y2="11" gradientUnits="userSpaceOnUse">
      <stop stop-color="#52AFE0"/>
      <stop offset="1" stop-color="#00529E" stop-opacity="0.1"/>
      </linearGradient>
      <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16 11) rotate(90) scale(12 19.2)">
      <stop stop-color="white"/>
      <stop offset="1" stop-color="white" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="clip0">
      <rect width="32.0002" height="27" rx="3" fill="white"/>
      </clipPath>
      </defs>
    </svg>

    <img v-if="icon === 'backup'" src="../../assets/icons/apple/folder-backup.svg" :height="height" :width="width"/>

    <!-- Image -->
    <svg
      v-if="icon==='image'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Image icon -->
    </svg>

    <!-- Pdf -->
    <svg
      v-if="icon==='pdf'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Pdf icon -->
    </svg>

    <!-- Video -->
    <svg
      v-if="icon==='video'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Video icon -->
    </svg>

    <!-- Audio -->
    <svg
      v-if="icon==='audio'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Audio icon -->
    </svg>

    <!-- Compressed file -->
    <svg
      v-if="icon==='compressed-file'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Compressed file -->
    </svg>

    <!-- Xls file -->
    <svg
      v-if="icon==='xls-file'"
      :width="width"
      :height="height"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg">
      <!-- Xls file -->
    </svg>

  </div>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default: ''
    },
    width: {
      type: String,
      default: '18'
    },
    height: {
      type: String,
      default: '18'
    },
    color: {
      type: String,
      default: 'white'
    }
  },
  name: 'FileIcon'
}
</script>