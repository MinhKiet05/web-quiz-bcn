/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Dòng này bắt buộc phải có để quét hết mọi file JSX trong src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}