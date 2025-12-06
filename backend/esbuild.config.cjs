// esbuild.config.cjs (using CommonJS syntax)

const esbuild = require('esbuild');

const externalPackages = [
    'minio',
    'express',
    'cors',
    'dotenv',
    'readable-stream',
    'undici',
    'safe-buffer',
    'get-intrinsic',
    'es-errors'
];


esbuild.build({
    entryPoints: ['src/main.ts'],
    outfile: 'dist/index.mjs',

    // Build options
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    minify: true,
    sourcemap: true,

    // External packages
    external: externalPackages,

    // Module resolution helpers
    mainFields: ['main', 'module'],
    resolveExtensions: ['.ts', '.js', '.cjs', '.mjs', '.json']
}).catch(() => process.exit(1));

console.log("ESBuild complete.");