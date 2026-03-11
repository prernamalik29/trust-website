/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  // Disable Tailwind's global browser reset so it doesn't conflict with the
  // existing admin panel CSS (which manages its own base styles / CSS vars).
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
