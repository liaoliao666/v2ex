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
}
