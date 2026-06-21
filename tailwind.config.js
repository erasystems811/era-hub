/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:            '#C4286F',
        'bg-2':        '#A82060',
        pink:          '#C4286F',
        'pink-light':  'rgba(255,255,255,0.12)',
        'pink-border': 'rgba(255,255,255,0.18)',
        teal:          '#4A9BA8',
        'teal-light':  'rgba(74,155,168,0.12)',
        charcoal:      '#0F172A',
        'charcoal-soft':'#64748B',
        rose:          '#BE123C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl:    '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      backdropBlur: { xs: '4px' },
      boxShadow: {
        glass:     '0 4px 32px rgba(0,0,0,0.16), 0 1px 6px rgba(0,0,0,0.08)',
        'glass-lg':'0 12px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.10)',
        card:      '0 1px 12px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
