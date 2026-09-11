/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        command: {
          bg: '#0b0f19',
          card: '#111827',
          border: '#1f2937',
          sidebar: '#0d1321'
        },
        risk: {
          critical: '#ef4444',
          high: '#f97316',
          watch: '#eab308',
          safe: '#22c55e'
        }
      }
    },
  },
  plugins: [],
}
