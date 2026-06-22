/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Single brand accent so the UI reads as intentional, not templated.
        brand: {
          50: '#eef4ff',
          100: '#dae6ff',
          500: '#3b6fe0',
          600: '#2f59c4',
          700: '#264aa3',
        },
      },
    },
  },
  plugins: [],
};
