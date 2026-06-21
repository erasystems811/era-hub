/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Background: warm pinkish tint — same energy as ERA Patient's teal tint
        bg:           '#FBF0F8',
        'bg-2':       '#F4E0EE',
        // Primary pink: bold, saturated, confident — same visual weight as teal
        pink:         '#C4286F',
        'pink-light': 'rgba(196,40,111,0.08)',
        'pink-border':'rgba(196,40,111,0.16)',
        // Teal: kept only for data/status indicators (health dots, etc.)
        teal:         '#4A9BA8',
        'teal-light': 'rgba(74,155,168,0.09)',
        charcoal:     '#111827',
        'charcoal-soft': '#6B7280',
        rose:         '#B91C4D',
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
        glass:     '0 2px 24px rgba(196,40,111,0.08), 0 1px 4px rgba(0,0,0,0.05)',
        'glass-lg':'0 8px 40px rgba(196,40,111,0.13), 0 2px 8px rgba(0,0,0,0.07)',
        card:      '0 1px 12px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
