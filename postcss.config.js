/**
 * PostCSS Configuration File
 *
 * This file tells the build tool (e.g., Vite/Webpack) to use PostCSS, 
 * and specifically tells PostCSS to use the Tailwind CSS and Autoprefixer plugins.
 * This is CRITICAL for resolving the "Unknown at rule @tailwind" error.
 */
export default {
    plugins: {
        // 1. Tailwind CSS plugin must be executed first to handle @tailwind directives
        'tailwindcss': {},

        // 2. Autoprefixer is typically run after Tailwind to add vendor prefixes
        'autoprefixer': {},
    },
}