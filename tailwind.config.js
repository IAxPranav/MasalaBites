/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FFF8EC',
        'bg-alt': '#FBEED9',
        surface: '#FFFFFF',
        ink: '#2A2018',
        'ink-soft': '#7A6A59',
        primary: '#C1440E',
        'primary-dark': '#97350A',
        saffron: '#E3A72B',
        cardamom: '#3F6E52',
        chili: '#A6261B',
        line: '#EADFC9',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Work Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
