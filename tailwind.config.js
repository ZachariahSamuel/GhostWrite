/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pp:  '#7C5CFC', pp2: '#9B7EFD', pp3: '#6344E8',
        vb:  '#0A0A0F', vb2: '#111118', vb3: '#1A1A24', vb4: '#22222E',
        sw:  '#F7F7FB',
        gg:  '#8A8B9A', gg2: '#6A6B7A', gg3: '#4A4B5A',
        fl:  '#EBE0FF',
        bg:  '#10B981',
        wa:  '#F59E0B',
        ae:  '#C67B5C',
        err: '#EF4444',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
        label:   ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '28px', 'xl3': '36px',
      },
    },
  },
  plugins: [],
}
