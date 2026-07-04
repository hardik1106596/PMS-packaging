/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4fbf5',
          100: '#e5f7eb',
          500: '#2f855a',
          600: '#276749',
          700: '#22543d',
        },
      },
    },
  },
  plugins: [],
};
