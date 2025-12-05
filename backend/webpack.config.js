// webpack.config.js

const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    // 1. Set mode to production for built-in optimizations (minification)
    mode: 'production',

    // 2. Define the entry point (your main application file)
    entry: './src/main.ts',

    // 3. Target Node.js environment
    target: 'node',

    // 4. Exclude Node.js modules from the bundle 
    // (e.g., express, cors, minio should be imported at runtime, not bundled)
    externals: [nodeExternals()],

    // 5. Define the output file and path
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js', // This will be the final bundled, minified file
    },

    // 6. Resolve file extensions (to allow importing .ts files without extension)
    resolve: {
        extensions: ['.ts', '.js'],
    },

    // 7. Define module rules (how to handle .ts files)
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};