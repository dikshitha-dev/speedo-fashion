/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        origami: {
          paper: '#FAFAFA',
          shadow: '#B0B0B0',
          ink: '#1A1A1A',
          coral: '#FF6B6B',
          sky: '#87CEEB',
          sage: '#A8D5BA',
          crease: '#F0C987',
          steel: '#4A4A4A'
        }
      },
      fontFamily: {
        origami: ['Poppins', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      }
    },
  },
  plugins: [],
}

