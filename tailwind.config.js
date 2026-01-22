/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#1F2128',      // Background
                    surface: '#2A2D3A',   // Cards
                    red: '#FF1F40',       // HIGH VISIBILITY RED (Brighter/Punchier)
                    redDim: '#D90429',    // Darker red for backgrounds if needed
                    textMain: '#FFFFFF',  // Text High
                    textSec: '#D1D5DB',   // Text Secondary (Lighter gray for better contrast)
                }
            },
            fontFamily: {
                sans: ['Montserrat', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
