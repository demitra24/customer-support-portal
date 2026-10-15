export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#0A0D14',      // app canvas (deep navy-black)
        panel: '#10141F',      // cards / sidebar
        panel2: '#171C2B',     // inputs / elevated
        line: '#232A3D',       // borders
        ink: '#E9EDF6',        // primary text (inverted from v1)
        mute: '#8B93A7',
        signal: '#FF5470',     // escalated / danger
        signalsoft: 'rgba(255,84,112,0.12)',
        moss: '#3DDC97',       // success / resolved
        mosssoft: 'rgba(61,220,151,0.12)',
        teal2: '#4CC9F0',      // info / in-progress
        tealsoft: 'rgba(76,201,240,0.12)',
        amber2: '#FFC24B',     // warning / high
        ambersoft: 'rgba(255,194,75,0.12)',
        iris: '#7C6CFF',       // BRAND accent
        irissoft: 'rgba(124,108,255,0.14)',
        cobalt: '#4D7CFE',     // gradient end
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 10px 40px -12px rgba(124,108,255,0.5)',
        'glow-sm': '0 4px 18px -6px rgba(124,108,255,0.45)',
      },
    },
  },
  plugins: [],
};