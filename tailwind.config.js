/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        wood: {
          50: '#faf6f0',
          100: '#f4ede1',
          200: '#ebd9c3',
          300: '#dec09f',
          400: '#cca278',
          500: '#ba8557',
          600: '#a36d45',
          700: '#825237',
          800: '#68412e',
          900: '#4d3023',
          950: '#2c1a12',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf6ef',
          200: '#f4ecdf',
          300: '#ebe0cd',
        }
      },
    },
  },
  plugins: [],
}
