/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          custom: '#69707A',
        },
        steel: {
          DEFAULT: '#337AB7',
          dark: '#2a6396',
        },
        navy: {
          DEFAULT: '#212832',
          light: '#2d3542',
        },
        ice: {
          DEFAULT: '#E8F0FE',
        },
        ghost: {
          DEFAULT: '#F2F6FC',
        },
        bright: {
          DEFAULT: '#0061F2',
        },
        mid: {
          DEFAULT: '#767676',
        },
        border: {
          DEFAULT: '#C5CCD6',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
