// esbuild.config.cjs (using CommonJS syntax)

const esbuild = require('esbuild');

const externalPackages = [
];


esbuild.build({
    entryPoints: ['src/main.ts'],
    outfile: 'dist/index.cjs',

    // Build options
    bundle: true,
    platform: 'node',
    target: 'es2024',
    format: 'cjs',
    minify: true,
    sourcemap: true,
    // banner: {
    //     js: '"use strict";',
    // },

    // External packages
    external: externalPackages,

    // Module resolution helpers
    mainFields: ['main', 'module'],
    resolveExtensions: ['.ts', '.js', '.cjs', '.mjs', '.json']
}).catch(() => process.exit(1));

console.log("ESBuild complete.");