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
        // ── Campus Press ──
        paper:  '#F4EFE6',
        paper2: '#ECE6D8',
        paper3: '#FBF8F2',
        ink:    '#1A1A17',
        ink2:   '#3A382F',
        mute:   '#76726A',
        blue:   '#2B44FF',
        blue2:  '#1B2ECC',
        coral:  '#FF4D3D',
        sun:    '#FFC53D',
        mint:   '#14C98A',
        // ── compatibility aliases (old dark tokens → Campus Press) so legacy
        //    dashboard pages render coherently until each is fully rewritten ──
        pp:  '#2B44FF', pp2: '#2B44FF', pp3: '#1B2ECC',
        cy:  '#2B44FF',
        vb:  '#F4EFE6', vb2: '#ECE6D8', vb3: '#FBF8F2', vb4: '#FBF8F2',
        sw:  '#1A1A17',
        gg:  '#76726A', gg2: '#3A382F', gg3: '#76726A',
        fl:  '#1A1A17',
        bg:  '#14C98A',
        wa:  '#E5A200',
        ae:  '#FF4D3D',
        err: '#FF4D3D',
      },
      fontFamily: {
        display: ['Clash Display', 'General Sans', 'sans-serif'],
        body:    ['General Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'b':    '6px 6px 0 #1A1A17',
        'b-sm': '4px 4px 0 #1A1A17',
        'b-lg': '9px 9px 0 #1A1A17',
        'b-xs': '3px 3px 0 #1A1A17',
      },
      borderRadius: {
        'xl2': '20px', 'xl3': '28px',
      },
      letterSpacing: { eyebrow: '0.14em' },
    },
  },
  plugins: [],
}
