/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,tsx}"],
  darkMode: ["class", ':host([darktheme="true"])'],
  theme: {
    extend: {},
  },
  plugins: [],
};
