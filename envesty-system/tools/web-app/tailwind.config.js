/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c0e12',
        slate: '#1c2230',
        mist: '#e8ecf2',
        accent: '#3d7bff',
      },
    },
  },
  plugins: [],
}
