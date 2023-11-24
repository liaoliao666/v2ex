const plugin = require('tailwindcss/plugin')

module.exports = {
  content: [
    './screens/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './navigation/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(29,155,240)',
        'primary-focus': 'rgb(26,140,216)',
        danger: `rgb(249,24,128)`,
        'danger-focus': `rgba(249,24,128,.8)`,
      },
    },
    screens: {
      sm: '380px',
      md: '420px',
      lg: '680px',
      // or maybe name them after devices for `tablet:flex-row`
      tablet: '1024px',
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.text-foreground': 'text-[#0f1419] dark:text-[rgb(219,219,219)]',
        '.bg-foreground': 'bg-[#0f1419] dark:bg-[rgb(219,219,219)]',
        '.text-default': 'text-[#536471] dark:text-[rgb(128,128,128)]',
        '.img-loading': 'bg-[rgb(185,202,211)] dark:bg-[rgb(62,65,68)]',
        '.bg-loading': 'bg-[#0000000f] dark:bg-[#ffffff0f]',
        '.bg-background': 'bg-white dark:bg-[#1a1a1a]',
        '.bg-content': 'bg-[#f0f3f5] dark:bg-[#262626]',
        '.bg-overlay': 'bg-[rgba(0,0,0,0.4)] dark:bg-[rgba(91,112,131,0.4)]',
        '.bg-input': 'bg-[rgb(239,243,244)] dark:bg-[rgb(32,35,39)]',
        '.bg-focus': 'dark:bg-[rgba(231,233,234,0.2)] bg-[#e7e9ea]',
        '.border-divider': 'border-[#eff3f4] dark:border-[#2f3336]',
      })
    }),
  ],
}
