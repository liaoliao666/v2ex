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
        primary: '#778087',
        'primary-focus': '#4d5256',
        secondary: 'rgb(29,155,240)',
        'secondary-focus': 'rgb(26,140,216)',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities(
        withTailWindHint({
          'text-tint-primary': 'text-[#0f1419] dark:text-[#e7e9ea]',
          'text-tint-primary-invert': 'dark:text-[#0f1419] text-[#e7e9ea]',
          'text-tint-secondary': 'text-[#536471] dark:text-[#71767b]',
          'text-tint-secondary-invert': 'dark:text-[#536471] text-[#71767b]',
          'text-body-1': 'text-[23px] leading-[32px]',
          'text-body-2': 'text-[21px] leading-[30px]',
          'text-body-3': 'text-[19px] leading-[28px]',
          'text-body-4': 'text-[17px] leading-[26px]',
          'text-body-5': 'text-[15px] leading-[24px]',
          'text-body-6': 'text-[13px] leading-[22px]',
          'bg-body-1': 'bg-white dark:bg-[#0f0f0f]',
          'bg-body-1-invert': 'dark:bg-white bg-[#0f0f0f]',
          'bg-body-2': 'bg-[#f0f3f5] dark:bg-[#1a1a1a]',
          'bg-mask': 'bg-[rgba(0,0,0,0.4)] dark:bg-[rgba(91,112,131,0.4)]',
          'bg-message-press':
            'bg-[rgba(230,236,240,0.7)] dark:bg-[rgba(18,21,23,0.7)]',
          'bg-tab-press': 'dark:bg-[rgba(231,233,234,0.2)] bg-[#e7e9ea]',
          'border-tint-border': 'border-[#eff3f4] dark:border-[#2f3336]',
        })
      )
    }),
  ],
}

function withTailWindHint(utilities) {
  return Object.fromEntries(
    Object.entries(utilities).flatMap(([key, val]) => [
      [key, val],
      [
        `.${key}`,
        {
          [`@apply ${val}`]: {},
        },
      ],
    ])
  )
}
