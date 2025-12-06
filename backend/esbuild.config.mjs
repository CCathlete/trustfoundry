// esbuild.config.mjs

import { build } from 'esbuild';

const externalPackages = [
    'minio',
    'express',
    'cors',
    'dotenv'
];

build({
    // Entry point: Your main TypeScript file
    entryPoints: ['src/main.ts'],

    // Output file
    outfile: 'dist/index.cjs',

    // Build options
    bundle: true,
    platform: 'node',
    target: 'es2022',
    format: 'cjs', // Output as CommonJS
    minify: true,
    sourcemap: true,

    // External packages: Keeps node_modules out of the bundle
    external: externalPackages,

    // THE FIX FOR THE CJS/STRICT MODE ISSUE: 
    // Inject compatibility code for old CJS modules that rely on globals
    inject: ['./shims.mjs'],

    // Module resolution helpers (from previous suggestion)
    mainFields: ['main', 'module'],
    resolveExtensions: ['.ts', '.js', '.cjs', '.mjs', '.json']

}).catch(() => process.exit(1));

console.log("ESBuild complete.");