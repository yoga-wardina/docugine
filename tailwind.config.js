/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#111827',
          panel: '#1f2937',
          border: '#374151',
          accent: '#8C2BEE',
          accentDark: '#7320D4',
          danger: '#dc2626',
          dangerDark: '#b91c1c',
          success: '#10b981',
          surface: '#f9fafb',
          surfaceAlt: '#f3f4f6',
        },
      },
    },
  },
  plugins: [],
};
