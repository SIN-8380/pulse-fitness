module.exports = {
      content: ['./index.html', './login.html', './src/**/*.{js,vue}'],
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f5f3ff',
              100: '#ede9fe',
              400: '#a78bfa',
              500: '#8b5cf6', // Electric Violet Accent
              600: '#7c3aed',
              700: '#6d28d9',
              glow: 'rgba(139, 92, 246, 0.35)',
            },
            dark: {
              950: '#060911',
              900: '#090d16',
              800: '#0f172a',
              700: '#1e293b',
              600: '#334155',
            }
          },
          fontFamily: {
            sans: ['Outfit', 'Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }