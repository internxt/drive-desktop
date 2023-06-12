import { LocalContextProps } from 'renderer/context/LocalContext';

export type MigrationSlideProps = {
  onGoNextSlide: () => void;
  onFinish: () => void;
  onStartMigration: () => void;
  onCancelMigration: () => void;
  onShowFailedItems: () => void;
  platform: string;
  currentSlide: number;
  totalSlides: number;
  translate: LocalContextProps['translate'];
  progress: {
    status: 'MIGRATING' | 'MIGRATION_FAILED' | 'MIGRATION_FINISHED';
    totalItemsToMigrate: number;
    migratedItems: number;
  };
};

export type MigrationSlide = {
  name: string;
  component: React.FC<MigrationSlideProps>;
  image: React.FC<MigrationSlideProps>;
  footer: React.FC<MigrationSlideProps>;
};

export const UploadSuccessAnimation = () => {
  return (
    <svg
      id="e3D4vWITAh71"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 400 224"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      width="400"
      height="224"
    >
      <defs>
        <filter
          id="e3D4vWITAh73-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="e3D4vWITAh73-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="16,10"
          />
          <feOffset
            id="e3D4vWITAh73-filter-drop-shadow-0-offset"
            dx="0"
            dy="32"
            result="tmp"
          />
          <feFlood
            id="e3D4vWITAh73-filter-drop-shadow-0-flood"
            flood-color="rgba(0,0,0,0.1)"
          />
          <feComposite
            id="e3D4vWITAh73-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge id="e3D4vWITAh73-filter-drop-shadow-0-merge" result="result">
            <feMergeNode id="e3D4vWITAh73-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="e3D4vWITAh73-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <filter
          id="e3D4vWITAh737-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="e3D4vWITAh737-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="4,4"
          />
          <feOffset
            id="e3D4vWITAh737-filter-drop-shadow-0-offset"
            dx="0"
            dy="4"
            result="tmp"
          />
          <feFlood
            id="e3D4vWITAh737-filter-drop-shadow-0-flood"
            flood-color="rgba(0,0,0,0.16)"
          />
          <feComposite
            id="e3D4vWITAh737-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge
            id="e3D4vWITAh737-filter-drop-shadow-0-merge"
            result="result"
          >
            <feMergeNode id="e3D4vWITAh737-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="e3D4vWITAh737-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <filter
          id="e3D4vWITAh750-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="e3D4vWITAh750-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="4,4"
          />
          <feOffset
            id="e3D4vWITAh750-filter-drop-shadow-0-offset"
            dx="0"
            dy="4"
            result="tmp"
          />
          <feFlood
            id="e3D4vWITAh750-filter-drop-shadow-0-flood"
            flood-color="rgba(0,0,0,0.16)"
          />
          <feComposite
            id="e3D4vWITAh750-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge
            id="e3D4vWITAh750-filter-drop-shadow-0-merge"
            result="result"
          >
            <feMergeNode id="e3D4vWITAh750-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="e3D4vWITAh750-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <linearGradient
          id="e3D4vWITAh755-fill"
          x1="0"
          y1="0.5"
          x2="1"
          y2="0.5"
          spreadMethod="pad"
          gradientUnits="objectBoundingBox"
          gradientTransform="translate(0 0)"
        >
          <stop id="e3D4vWITAh755-fill-0" offset="0%" stop-color="#f3f3f8" />
          <stop
            id="e3D4vWITAh755-fill-1"
            offset="100%"
            stop-color="rgba(243,243,248,0)"
          />
        </linearGradient>
        <linearGradient
          id="e3D4vWITAh756-fill"
          x1="0"
          y1="0.5"
          x2="1"
          y2="0.5"
          spreadMethod="pad"
          gradientUnits="objectBoundingBox"
          gradientTransform="translate(0 0)"
        >
          <stop
            id="e3D4vWITAh756-fill-0"
            offset="0%"
            stop-color="rgba(243,243,248,0)"
          />
          <stop id="e3D4vWITAh756-fill-1" offset="100%" stop-color="#f3f3f8" />
        </linearGradient>
      </defs>
      <rect
        width="65.970167"
        height="48.718962"
        rx="0"
        ry="0"
        transform="matrix(6.063347 0 0 4.597799-.000005 0.000003)"
        fill="#f3f3f8"
        stroke-width="0"
      />
      <g transform="translate(.457793 0)" filter="url(#e3D4vWITAh73-filter)">
        <g id="e3D4vWITAh74_to" transform="translate(-15.467793,112.5325)">
          <g
            id="e3D4vWITAh74"
            transform="scale(0.71,0.71) translate(-197,-114.5)"
            opacity="0"
          >
            <path
              d="M157.5,61.25c0-2.8995,2.351-5.25,5.25-5.25h37.317c4.153,0,8.17,1.4767,11.334,4.1661l23.933,20.3427c3.912,3.325,6.166,8.2,6.166,13.3339v68.9073c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v-101.5Z"
              fill="#fcfcfd"
            />
            <path
              d="M236.25,167.3h-73.5c-2.513,0-4.55-2.037-4.55-4.55v-101.5c0-2.5129,2.037-4.55,4.55-4.55h37.317c3.987,0,7.843,1.4176,10.881,3.9994L234.88,81.0421c3.756,3.192,5.92,7.872,5.92,12.8006v68.9073c0,2.513-2.037,4.55-4.55,4.55Z"
              fill="none"
              stroke="#e5e5eb"
              stroke-width="1.4"
            />
            <path
              d="M204.167,58.1462c-.575-.6138-1.351-1.1621-2.217-1.364v-.0642c2.972.1534,5.819,1.2797,8.097,3.2156l25.666,21.8162c3.049,2.5915,4.877,6.3242,5.07,10.3002h-.065c-.202-.8655-.75-1.6415-1.364-2.2169-.769-.7209-1.807-1.2831-2.754-1.2831h-26.6c-2.513,0-4.55-2.0371-4.55-4.55v-23.1c0-.9466-.562-1.9849-1.283-2.7538Z"
              fill="#f3f3f8"
              stroke="#e5e5eb"
              stroke-width="1.4"
            />
            <path
              d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
              fill="#e5e5eb"
            />
            <g mask="url(#e3D4vWITAh711)">
              <path
                d="M236.25,164.5h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,162.75c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7ZM236.25,161h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,159.25c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7Zm-77,3.5v-3.5h-7v3.5h7Zm84,0v-3.5h-7v3.5h7Z"
                fill="#e5e5eb"
              />
              <mask
                id="e3D4vWITAh711"
                mask-type="luminance"
                x="-150%"
                y="-150%"
                height="400%"
                width="400%"
              >
                <path
                  d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                  fill="#fff"
                />
              </mask>
            </g>
          </g>
        </g>
        <g id="e3D4vWITAh713_to" transform="translate(85.532207,112.5325)">
          <g id="e3D4vWITAh713_ts" transform="scale(0.71,0.71)">
            <g transform="translate(-197,-114.5)">
              <path
                d="M157.5,61.25c0-2.8995,2.351-5.25,5.25-5.25h37.317c4.153,0,8.17,1.4767,11.334,4.1661l23.933,20.3427c3.912,3.325,6.166,8.2,6.166,13.3339v68.9073c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v-101.5Z"
                fill="#fcfcfd"
              />
              <path
                d="M236.25,167.3h-73.5c-2.513,0-4.55-2.037-4.55-4.55v-101.5c0-2.5129,2.037-4.55,4.55-4.55h37.317c3.987,0,7.843,1.4176,10.881,3.9994L234.88,81.0421c3.756,3.192,5.92,7.872,5.92,12.8006v68.9073c0,2.513-2.037,4.55-4.55,4.55Z"
                fill="none"
                stroke="#e5e5eb"
                stroke-width="1.4"
              />
              <path
                d="M204.167,58.1462c-.575-.6138-1.351-1.1621-2.217-1.364v-.0642c2.972.1534,5.819,1.2797,8.097,3.2156l25.666,21.8162c3.049,2.5915,4.877,6.3242,5.07,10.3002h-.065c-.202-.8655-.75-1.6415-1.364-2.2169-.769-.7209-1.807-1.2831-2.754-1.2831h-26.6c-2.513,0-4.55-2.0371-4.55-4.55v-23.1c0-.9466-.562-1.9849-1.283-2.7538Z"
                fill="#f3f3f8"
                stroke="#e5e5eb"
                stroke-width="1.4"
              />
              <path
                d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                fill="#e5e5eb"
              />
              <g mask="url(#e3D4vWITAh720)">
                <path
                  d="M236.25,164.5h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,162.75c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7ZM236.25,161h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,159.25c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7Zm-77,3.5v-3.5h-7v3.5h7Zm84,0v-3.5h-7v3.5h7Z"
                  fill="#e5e5eb"
                />
                <mask
                  id="e3D4vWITAh720"
                  mask-type="luminance"
                  x="-150%"
                  y="-150%"
                  height="400%"
                  width="400%"
                >
                  <path
                    d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                    fill="#fff"
                  />
                </mask>
              </g>
            </g>
          </g>
        </g>
        <g id="e3D4vWITAh722_to" transform="translate(197.042207,112.75)">
          <g id="e3D4vWITAh722_ts" transform="scale(1,1)">
            <g transform="translate(-197,-114.5)">
              <path
                d="M157.5,61.25c0-2.8995,2.351-5.25,5.25-5.25h37.317c4.153,0,8.17,1.4767,11.334,4.1661l23.933,20.3427c3.912,3.325,6.166,8.2,6.166,13.3339v68.9073c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v-101.5Z"
                fill="#fcfcfd"
              />
              <path
                d="M236.25,167.3h-73.5c-2.513,0-4.55-2.037-4.55-4.55v-101.5c0-2.5129,2.037-4.55,4.55-4.55h37.317c3.987,0,7.843,1.4176,10.881,3.9994L234.88,81.0421c3.756,3.192,5.92,7.872,5.92,12.8006v68.9073c0,2.513-2.037,4.55-4.55,4.55Z"
                fill="none"
                stroke="#e5e5eb"
                stroke-width="1.4"
              />
              <path
                d="M204.167,58.1462c-.575-.6138-1.351-1.1621-2.217-1.364v-.0642c2.972.1534,5.819,1.2797,8.097,3.2156l25.666,21.8162c3.049,2.5915,4.877,6.3242,5.07,10.3002h-.065c-.202-.8655-.75-1.6415-1.364-2.2169-.769-.7209-1.807-1.2831-2.754-1.2831h-26.6c-2.513,0-4.55-2.0371-4.55-4.55v-23.1c0-.9466-.562-1.9849-1.283-2.7538Z"
                fill="#f3f3f8"
                stroke="#e5e5eb"
                stroke-width="1.4"
              />
              <path
                d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                fill="#e5e5eb"
              />
              <g mask="url(#e3D4vWITAh729)">
                <path
                  d="M236.25,164.5h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,162.75c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7ZM236.25,161h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,159.25c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7Zm-77,3.5v-3.5h-7v3.5h7Zm84,0v-3.5h-7v3.5h7Z"
                  fill="#e5e5eb"
                />
                <mask
                  id="e3D4vWITAh729"
                  mask-type="luminance"
                  x="-150%"
                  y="-150%"
                  height="400%"
                  width="400%"
                >
                  <path
                    d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                    fill="#fff"
                  />
                </mask>
              </g>
              <g
                id="e3D4vWITAh731_ts"
                transform="translate(199.5,119.999985) scale(0.5,0.5)"
              >
                <g
                  id="e3D4vWITAh731"
                  transform="translate(-200,-119.999985)"
                  opacity="0"
                >
                  <ellipse
                    rx="20"
                    ry="20"
                    transform="translate(200.000002 119.999985)"
                    fill="none"
                    stroke="#06f"
                    stroke-width="6"
                    stroke-opacity="0.15"
                    stroke-linecap="round"
                    stroke-dasharray="0"
                  />
                  <ellipse
                    rx="20"
                    ry="20"
                    transform="translate(200.000002 119.999985) rotate(-90)"
                    fill="none"
                    stroke="#06f"
                    stroke-width="6"
                    stroke-linecap="round"
                    stroke-dashoffset="94.25"
                    stroke-dasharray="125.66"
                  />
                  <g
                    id="e3D4vWITAh734_tr"
                    transform="translate(200.000002,119.999985) rotate(0)"
                  >
                    <ellipse
                      rx="20"
                      ry="20"
                      transform="translate(0,0)"
                      fill="none"
                      stroke="#06f"
                      stroke-width="6"
                      stroke-linecap="round"
                      stroke-dashoffset="94.25"
                      stroke-dasharray="125.66"
                    />
                  </g>
                  <g
                    id="e3D4vWITAh735_tr"
                    transform="translate(200.000002,119.999985) rotate(0)"
                  >
                    <ellipse
                      rx="20"
                      ry="20"
                      transform="translate(0,0)"
                      fill="none"
                      stroke="#06f"
                      stroke-width="6"
                      stroke-linecap="round"
                      stroke-dashoffset="94.25"
                      stroke-dasharray="125.66"
                    />
                  </g>
                  <g
                    id="e3D4vWITAh736_tr"
                    transform="translate(200.000002,119.999985) rotate(0)"
                  >
                    <ellipse
                      rx="20"
                      ry="20"
                      transform="translate(0,0)"
                      fill="none"
                      stroke="#06f"
                      stroke-width="6"
                      stroke-linecap="round"
                      stroke-dashoffset="94.25"
                      stroke-dasharray="125.66"
                    />
                  </g>
                </g>
              </g>
              <g
                id="e3D4vWITAh737_ts"
                transform="translate(199.499999,119.999985) scale(0.9,0.9)"
              >
                <g
                  id="e3D4vWITAh737"
                  transform="translate(-311.500793,-117.715202)"
                  opacity="0"
                  filter="url(#e3D4vWITAh737-filter)"
                >
                  <path
                    d="M323.379,125.652c1.569-2.349,2.407-5.111,2.407-7.937-.004-3.787-1.51-7.418-4.189-10.096-2.678-2.679-6.309-4.185-10.096-4.189-2.826,0-5.588.838-7.937,2.407-2.349,1.57-4.18,3.801-5.262,6.411-1.081,2.611-1.364,5.483-.813,8.254.552,2.772,1.912,5.317,3.91,7.315s4.543,3.358,7.315,3.91c2.771.551,5.643.268,8.253-.813c2.611-1.082,4.842-2.913,6.412-5.262Zm-5.119-11.719c-.08-.193-.197-.368-.345-.515-.148-.148-.322-.265-.515-.346-.193-.08-.399-.121-.608-.122-.208,0-.415.041-.608.12-.193.08-.368.196-.515.344l-6.285,6.286-2.051-2.049c-.148-.148-.323-.265-.516-.345s-.4-.121-.609-.121-.415.041-.608.121-.368.197-.516.345c-.148.147-.265.323-.345.515-.08.193-.121.4-.121.609s.041.415.121.608.197.369.345.516l3.174,3.175c.148.148.323.265.516.345s.4.122.609.122.416-.042.609-.122c.192-.08.368-.197.515-.345l7.408-7.408c.148-.147.265-.322.345-.515s.121-.4.121-.609-.041-.416-.121-.609Z"
                    clip-rule="evenodd"
                    fill="#2dae4d"
                    fill-rule="evenodd"
                  />
                  <path
                    d="M317.915,113.418c.148.147.265.322.345.515s.121.4.121.609-.041.416-.121.609-.197.368-.345.515l-7.408,7.408c-.147.148-.323.265-.515.345-.193.08-.4.122-.609.122s-.416-.042-.609-.122-.368-.197-.516-.345l-3.174-3.175c-.148-.147-.265-.323-.345-.516s-.121-.399-.121-.608.041-.416.121-.609c.08-.192.197-.368.345-.515.148-.148.323-.265.516-.345s.399-.121.608-.121.416.041.609.121.368.197.516.345l2.051,2.049l6.285-6.286c.147-.148.322-.264.515-.344.193-.079.4-.12.608-.12.209.001.415.042.608.122.193.081.367.198.515.346Z"
                    fill="#fff"
                  />
                  <path
                    d="M326.977,117.715v-.001c-.005-4.103-1.637-8.036-4.538-10.937s-6.834-4.533-10.937-4.538h-.001c-3.061,0-6.054.908-8.599,2.608-2.545,1.701-4.528,4.118-5.7,6.946-1.171,2.828-1.477,5.94-.88,8.942s2.071,5.759,4.235,7.924c2.165,2.164,4.922,3.638,7.924,4.235s6.114.291,8.942-.88c2.828-1.172,5.245-3.155,6.946-5.7c1.7-2.546,2.608-5.538,2.608-8.599Z"
                    fill="none"
                    stroke="#fff"
                    stroke-width="2.38095"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
        <g id="e3D4vWITAh741_to" transform="translate(310,112.5325)">
          <g
            id="e3D4vWITAh741"
            transform="scale(0.71,0.71) translate(-197,-114.5)"
          >
            <path
              d="M157.5,61.25c0-2.8995,2.351-5.25,5.25-5.25h37.317c4.153,0,8.17,1.4767,11.334,4.1661l23.933,20.3427c3.912,3.325,6.166,8.2,6.166,13.3339v68.9073c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v-101.5Z"
              fill="#fcfcfd"
            />
            <path
              d="M236.25,167.3h-73.5c-2.513,0-4.55-2.037-4.55-4.55v-101.5c0-2.5129,2.037-4.55,4.55-4.55h37.317c3.987,0,7.843,1.4176,10.881,3.9994L234.88,81.0421c3.756,3.192,5.92,7.872,5.92,12.8006v68.9073c0,2.513-2.037,4.55-4.55,4.55Z"
              fill="none"
              stroke="#e5e5eb"
              stroke-width="1.4"
            />
            <path
              d="M204.167,58.1462c-.575-.6138-1.351-1.1621-2.217-1.364v-.0642c2.972.1534,5.819,1.2797,8.097,3.2156l25.666,21.8162c3.049,2.5915,4.877,6.3242,5.07,10.3002h-.065c-.202-.8655-.75-1.6415-1.364-2.2169-.769-.7209-1.807-1.2831-2.754-1.2831h-26.6c-2.513,0-4.55-2.0371-4.55-4.55v-23.1c0-.9466-.562-1.9849-1.283-2.7538Z"
              fill="#f3f3f8"
              stroke="#e5e5eb"
              stroke-width="1.4"
            />
            <path
              d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
              fill="#e5e5eb"
            />
            <g mask="url(#e3D4vWITAh748)">
              <path
                d="M236.25,164.5h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,162.75c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7ZM236.25,161h-73.5v7h73.5v-7Zm-73.5,0c-.966,0-1.75-.784-1.75-1.75h-7c0,4.832,3.918,8.75,8.75,8.75v-7ZM238,159.25c0,.966-.784,1.75-1.75,1.75v7c4.832,0,8.75-3.918,8.75-8.75h-7Zm-77,3.5v-3.5h-7v3.5h7Zm84,0v-3.5h-7v3.5h7Z"
                fill="#e5e5eb"
              />
              <mask
                id="e3D4vWITAh748"
                mask-type="luminance"
                x="-150%"
                y="-150%"
                height="400%"
                width="400%"
              >
                <path
                  d="M162.75,168h73.5c2.899,0,5.25-2.351,5.25-5.25v-3.5c0,2.899-2.351,5.25-5.25,5.25h-73.5c-2.899,0-5.25-2.351-5.25-5.25v3.5c0,2.899,2.351,5.25,5.25,5.25Z"
                  fill="#fff"
                />
              </mask>
            </g>
            <g
              transform="matrix(1.292307 0 0 1.292307-203.054656-32.124195)"
              filter="url(#e3D4vWITAh750-filter)"
            >
              <path
                d="M323.379,125.652c1.569-2.349,2.407-5.111,2.407-7.937-.004-3.787-1.51-7.418-4.189-10.096-2.678-2.679-6.309-4.185-10.096-4.189-2.826,0-5.588.838-7.937,2.407-2.349,1.57-4.18,3.801-5.262,6.411-1.081,2.611-1.364,5.483-.813,8.254.552,2.772,1.912,5.317,3.91,7.315s4.543,3.358,7.315,3.91c2.771.551,5.643.268,8.253-.813c2.611-1.082,4.842-2.913,6.412-5.262Zm-5.119-11.719c-.08-.193-.197-.368-.345-.515-.148-.148-.322-.265-.515-.346-.193-.08-.399-.121-.608-.122-.208,0-.415.041-.608.12-.193.08-.368.196-.515.344l-6.285,6.286-2.051-2.049c-.148-.148-.323-.265-.516-.345s-.4-.121-.609-.121-.415.041-.608.121-.368.197-.516.345c-.148.147-.265.323-.345.515-.08.193-.121.4-.121.609s.041.415.121.608.197.369.345.516l3.174,3.175c.148.148.323.265.516.345s.4.122.609.122.416-.042.609-.122c.192-.08.368-.197.515-.345l7.408-7.408c.148-.147.265-.322.345-.515s.121-.4.121-.609-.041-.416-.121-.609Z"
                clip-rule="evenodd"
                fill="#2dae4d"
                fill-rule="evenodd"
              />
              <path
                d="M317.915,113.418c.148.147.265.322.345.515s.121.4.121.609-.041.416-.121.609-.197.368-.345.515l-7.408,7.408c-.147.148-.323.265-.515.345-.193.08-.4.122-.609.122s-.416-.042-.609-.122-.368-.197-.516-.345l-3.174-3.175c-.148-.147-.265-.323-.345-.516s-.121-.399-.121-.608.041-.416.121-.609c.08-.192.197-.368.345-.515.148-.148.323-.265.516-.345s.399-.121.608-.121.416.041.609.121.368.197.516.345l2.051,2.049l6.285-6.286c.147-.148.322-.264.515-.344.193-.079.4-.12.608-.12.209.001.415.042.608.122.193.081.367.198.515.346Z"
                fill="#fff"
              />
              <path
                d="M326.977,117.715v-.001c-.005-4.103-1.637-8.036-4.538-10.937s-6.834-4.533-10.937-4.538h-.001c-3.061,0-6.054.908-8.599,2.608-2.545,1.701-4.528,4.118-5.7,6.946-1.171,2.828-1.477,5.94-.88,8.942s2.071,5.759,4.235,7.924c2.165,2.164,4.922,3.638,7.924,4.235s6.114.291,8.942-.88c2.828-1.172,5.245-3.155,6.946-5.7c1.7-2.546,2.608-5.538,2.608-8.599Z"
                fill="none"
                stroke="#fff"
                stroke-width="2.38095"
              />
            </g>
          </g>
        </g>
      </g>
      <g transform="translate(0 0.000001)">
        <rect
          width="48"
          height="27.536766"
          rx="0"
          ry="0"
          transform="matrix(1 0 0 8.134579 0 0)"
          fill="url(#e3D4vWITAh755-fill)"
        />
        <rect
          width="48"
          height="27.536766"
          rx="0"
          ry="0"
          transform="matrix(1 0 0 8.134579 352 0)"
          fill="url(#e3D4vWITAh756-fill)"
        />
      </g>
    </svg>
  );
};
