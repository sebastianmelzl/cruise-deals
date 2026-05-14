/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ocean: {
          50:  '#eff9ff',
          100: '#dff2ff',
          200: '#b8e7ff',
          300: '#79d6ff',
          400: '#33c0fd',
          500: '#09a8ee',
          600: '#0086cb',
          700: '#006ba4',
          800: '#035a87',
          900: '#084b70',
          950: '#062f4b',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
