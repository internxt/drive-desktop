/* eslint-disable */
module.exports = {
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      rotate: {
        20: '20deg',
        30: '30deg',
      },
      letterSpacing: {
        0.2: '0.2rem',
        0.3: '0.3rem',
        0.4: '0.4rem',
      },
      lineHeight: {
        base: '120%',
      },
      transitionProperty: {
        width: 'width',
      },
      height: {
        footer: 'var(--footer-height)',
        fit: 'fit-content',
      },
      width: {
        sidenav: '210px',
        'sidenav-collapsed': '64px',
        activity: '296px',
        '0.5/12': '4.166667%',
      },
      margin: {
        '24px': '24px',
      },
      minWidth: {
        104: '26rem',
        activity: '296px',
      },
      padding: {
        '42px': '42px',
      },
      borderWidth: {
        3: '3px',
      },
      ringOpacity: (theme) => ({
        DEFAULT: '0.5',
        ...theme('opacity'),
      }),
      ringWidth: {
        DEFAULT: '3px',
        0: '0px',
        1: '1px',
        2: '2px',
        3: '3px',
        4: '4px',
        8: '8px',
      },
      borderRadius: {
        '1px': '1px',
        '2px': '2px',
        '4px': '4px',
        '6px': '6px',
        '12px': '12px',
        '1/2': '50%',
      },
      fontSize: {
        'supporting-2': '10px',
        'supporting-1': '8px',
      },
      spacing: {
        50: '12.7rem',
        104: '26rem',
        112: '28rem',
        120: '30rem',
        156: '37.5rem',
      },
      boxShadow: {
        b: '2px 1px 3px 0 rgba(0,0,0,0.1),2px 1px 2px 0 rgba(0,0,0,0.06)',
      },
    },
    colors: {
      debug: 'green',
      black: '#000000',
      pink: {
        10: '#FCE7F3',
        60: '#DB2777',
      },
      gray: {
        5: '#F3F3F8',
        10: '#f4f4f4',
        20: '#e0e0e0',
        30: '#c6c6c6',
        40: '#a8a8a8',
        50: '#8E8E94',
        60: '#6f6f6f',
        70: '#525252',
        80: '#393939',
        90: '#161616',
        100: '#18181B',
      },
      blue: {
        10: '#edf5ff',
        20: '#d0e2ff',
        30: '#a6c8ff',
        40: '#78a9ff',
        50: '#4589ff',
        60: '#0f62fe',
        70: '#0043ce',
        80: '#002d9c',
        90: '#001d6c',
        100: '#001141',
      },
      white: '#ffffff',
      red: {
        10: '#fff1f1',
        20: '#ffd7d9',
        30: '#ffb3b8',
        40: '#ff8389',
        50: '#fa4d56',
        60: '#da1e28',
        70: '#a2191f',
        80: '#750e13',
        90: '#520408',

        100: '#2d0709',
      },
      orange: {
        10: '#fff2e8',
        20: '#ffd9be',
        30: '#ffb784',
        40: '#ff832b',
        50: '#eb6200',
        60: '#ba4e00',
        70: '#8a3800',
        80: '#5e2900',
        90: '#3e1a00',
        100: '#231000',
      },
      green: {
        10: '#defbe6',
        20: '#a7f0ba',
        30: '#6fdc8c',
        40: '#42be65',
        50: '#24a148',
        60: '#198038',
        70: '#0e6027',
        80: '#044317',
        90: '#022d0d',
        100: '#071908',
      },
      yellow: {
        10: '#fcf4d6',
        20: '#fddc69',
        30: '#f1c21b',
        40: '#d2a106',
        50: '#b28600',
        60: '#8e6a00',
        70: '#684e00',
        80: '#483700',
        90: '#302400',
        100: '#1c1500',
      },
      'm-neutral': {
        60: '#b3bac5',
        70: '#a5adba',
        80: '#97a0af',
        100: '#7a869a',
        200: '#6b778c',
        300: '#5e6c84',
        400: '#505f79',
      },
      'l-neutral': {
        10: '#fafbfc',
        20: '#f4f5f7',
        30: '#ebecf0',
        40: '#dfe1e6',
        50: '#c1c7d0',
      },
      neutral: {
        500: '#42526e',
        600: '#344563',
        700: '#253858',
        800: '#172b4d',
        900: '#091e42',
      },
      primary: '#0066FF',
    },
  },
  variants: {
    extend: {
      ringWidth: ['hover', 'active', 'focus'],
      ringColor: ['hover', 'active', 'focus'],
      borderWidth: ['hover', 'active', 'focus'],
      borderRadius: ['responsive', 'hover', 'active', 'focus'],
      backgroundColor: ['active', 'hover', 'focus'],
      visibility: ['group-hover'],
      width: ['hover', 'active', 'focus'],
    },
  },
  plugins: [
    function ({ addBase, theme }) {
      function extractColorVars(colorObj, colorGroup = '') {
        return Object.keys(colorObj).reduce((vars, colorKey) => {
          const value = colorObj[colorKey];

          const newVars =
            typeof value === 'string'
              ? { [`--color${colorGroup}-${colorKey}`]: value }
              : extractColorVars(value, `-${colorKey}`);

          return { ...vars, ...newVars };
        }, {});
      }

      addBase({
        ':root': extractColorVars(theme('colors')),
      });
    },
  ],
};
