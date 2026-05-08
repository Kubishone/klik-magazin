/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#6F7730',
          50:  '#f5f6e8',
          100: '#e8eac8',
          200: '#d0d490',
          300: '#b8bf58',
          400: '#9aaa3a',
          500: '#6F7730',
          600: '#586020',
          700: '#424818',
          800: '#2c3010',
          900: '#161808',
        },
        navy: {
          DEFAULT: '#004F99',
          50:  '#e6f0fa',
          100: '#cce0f5',
          200: '#99c1eb',
          300: '#66a2e0',
          400: '#3383d6',
          500: '#004F99',
          600: '#003f7a',
          700: '#002f5c',
          800: '#00203d',
          900: '#00101f',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'border-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':       { backgroundPosition: '100% 50%' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.25', transform: 'scale(1)' },
          '50%':      { opacity: '0.55', transform: 'scale(1.12)' },
        },
        'line-grow': {
          '0%':   { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'border-shift': 'border-shift 6s ease infinite',
        'breathe':      'breathe 5s ease-in-out infinite',
        'line-grow':    'line-grow 1s ease forwards',
        'fade-up':      'fade-up 0.8s ease forwards',
      },
    },
  },
  plugins: [],
}
