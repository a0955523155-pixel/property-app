/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // 關鍵在下面這一行，必須包含 src 裡面的所有資料夾
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}