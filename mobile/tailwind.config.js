/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './screens/**/*.tsx',
    './components/**/*.tsx',
  ],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
