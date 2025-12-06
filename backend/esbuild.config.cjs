// esbuild.config.cjs (using CommonJS syntax)

const esbuild = require('esbuild');

const externalPackages = [
    // --- Frameworks ---
    'express',
    'cors',
    'dotenv',

    // --- MinIO + deps ---
    'minio',
    'readable-stream',
    'safe-buffer',
    'get-intrinsic',
    'es-errors',
    'undici',

    // --- Express CJS dependency chain ---
    'accepts',
    'array-flatten',
    'body-parser',
    'bytes',
    'content-disposition',
    'content-type',
    'cookie',
    'cookie-signature',
    'debug',
    'depd',
    'destroy',
    'ee-first',
    'encodeurl',
    'escape-html',
    'etag',
    'finalhandler',
    'fresh',
    'http-errors',
    'iconv-lite',
    'media-typer',
    'merge-descriptors',
    'methods',
    'mime',
    'mime-db',
    'mime-types',
    'ms',
    'negotiator',
    'on-finished',
    'parseurl',
    'path-to-regexp',
    'proxy-addr',
    'qs',
    'range-parser',
    'raw-body',
    'safe-buffer',
    'send',
    'serve-static',
    'setprototypeof',
    'statuses',
    'type-is',
    'unpipe',
    'utils-merge',
    'vary'
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