/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#F9E8F4',
        'bg-2':  '#F2D4EE',
        pink:    '#E991C8',
        'pink-light': 'rgba(233,145,200,0.15)',
        'pink-border': 'rgba(233,145,200,0.25)',
        teal:    '#4A9BA8',
        'teal-light': 'rgba(74,155,168,0.12)',
        charcoal: '#2D2D2D',
        'charcoal-soft': '#5A5A5A',
        rose:    '#D05080',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(233,145,200,0.12), 0 1px 4px rgba(0,0,0,0.06)',
        'glass-lg': '0 8px 40px rgba(233,145,200,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        card: '0 2px 16px rgba(45,45,45,0.06)',
      },
    },
  },
  plugins: [],
}
