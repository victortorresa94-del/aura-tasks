/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'aura-black': '#0E1114',
                'aura-gray': '#1F2A33',
                'aura-gray-light': '#2A3A42',
                'aura-white': '#F2F4F6',
                'aura-accent': '#D4E157', // Lime/Green desaturated
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
