/* eslint-disable */
const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'media',
  content: ['./src/**/*.tsx'],
  theme: {
    colors: {
      debug: 'green',
      inherit: 'inherit',
      transparent: colors.transparent,
      white: colors.white,
      black: colors.black,
      highlight: 'rgb(var(--color-highlight) / <alpha-value>)',
      surface: 'rgb(var(--color-surface) / <alpha-value>)',
      gray: {
        1: 'rgb(var(--color-gray-1) / <alpha-value>)',
        5: 'rgb(var(--color-gray-5) / <alpha-value>)',
        10: 'rgb(var(--color-gray-10) / <alpha-value>)',
        20: 'rgb(var(--color-gray-20) / <alpha-value>)',
        30: 'rgb(var(--color-gray-30) / <alpha-value>)',
        40: 'rgb(var(--color-gray-40) / <alpha-value>)',
        50: 'rgb(var(--color-gray-50) / <alpha-value>)',
        60: 'rgb(var(--color-gray-60) / <alpha-value>)',
        70: 'rgb(var(--color-gray-70) / <alpha-value>)',
        80: 'rgb(var(--color-gray-80) / <alpha-value>)',
        90: 'rgb(var(--color-gray-90) / <alpha-value>)',
        100: 'rgb(var(--color-gray-100) / <alpha-value>)',
      },
      primary: 'rgb(var(--color-primary) / <alpha-value>)',
      'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
      red: 'rgb(var(--color-red) / <alpha-value>)',
      'red-dark': 'rgb(var(--color-red-dark) / <alpha-value>)',
      orange: 'rgb(var(--color-orange) / <alpha-value>)',
      'orange-dark': 'rgb(var(--color-orange-dark) / <alpha-value>)',
      yellow: 'rgb(var(--color-yellow) / <alpha-value>)',
      'yellow-dark': 'rgb(var(--color-yellow-dark) / <alpha-value>)',
      green: 'rgb(var(--color-green) / <alpha-value>)',
      'green-dark': 'rgb(var(--color-green-dark) / <alpha-value>)',
    },
    extend: {
      opacity: {
        1: '.01',
        2: '.02',
        3: '.03',
        4: '.04',
        5: '.05',
        6: '.06',
        7: '.07',
        8: '.08',
        9: '.09',
        15: '.15',
        25: '.25',
        35: '.35',
        45: '.45',
        55: '.55',
        65: '.65',
        75: '.75',
        85: '.85',
        95: '.95',
      },
      zIndex: {
        1: '1',
      },
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
