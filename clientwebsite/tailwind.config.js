/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors : {
        "primary-200" : "#0a7ea4",  // Updated to match app's tintColorLight
        "primary-100" : "#0a7ea4",  // Updated to match app's tintColorLight
        "secondary-200" : "#0a7ea4", // Updated to match app's tintColorLight
        "secondary-100" : "#151718", // Updated to match app's dark background
        "text-light": "#11181C",     // App's light text color
        "text-dark": "#ECEDEE",      // App's dark text color
        "bg-light": "#fff",          // App's light background
        "bg-dark": "#151718",        // App's dark background
        "icon-light": "#687076",     // App's light icon color
        "icon-dark": "#9BA1A6"       // App's dark icon color
      }
    },
  },
  plugins: [],
}
