/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pastel: {
                    red: '#E8B4B8',
                    'red-dark': '#D4989D',
                    'red-light': '#F5D5D8',
                    cream: '#FFF8E7',
                    accent: '#C9999E',
                    bg: '#FFFBF5',
                },
                text: {
                    dark: '#4A4A4A',
                    light: '#6B6B6B',
                }
            },
            fontFamily: {
                heading: ['"Playfair Display"', 'serif'],
                body: ['Inter', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(232, 180, 184, 0.5), 0 0 10px rgba(232, 180, 184, 0.3)' },
                    '100%': { boxShadow: '0 0 10px rgba(232, 180, 184, 0.8), 0 0 20px rgba(232, 180, 184, 0.5)' },
                },
            },
        },
    },
    plugins: [],
}
