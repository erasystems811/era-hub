/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Proper pinkish background — same way ERA Patient has a teal-tinted bg
        bg:            '#EFD9E8',
        'bg-2':        '#E5C8DC',
        // Primary pink: bold, saturated, defined — the teal of this app
        pink:          '#B5226A',
        'pink-light':  'rgba(181,34,106,0.08)',
        'pink-border': 'rgba(181,34,106,0.18)',
        // Teal: only for healthy/active status dots
        teal:          '#4A9BA8',
        'teal-light':  'rgba(74,155,168,0.09)',
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
        glass:     '0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glass-lg':'0 12px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
        card:      '0 1px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
