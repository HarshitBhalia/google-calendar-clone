import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'gc-blue': '#1a73e8',
        'gc-red': '#d93025',
        'gc-green': '#0f9d58',
        'gc-yellow': '#f4b400',
        'gc-teal': '#00897b',
        'gc-gray-50': '#f8f9fa',
        'gc-gray-200': '#e8eaed',
        'gc-gray-600': '#80868b',
        'gc-gray-900': '#202124',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        'google-sans': ['"Google Sans"', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
