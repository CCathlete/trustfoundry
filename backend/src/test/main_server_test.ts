// main.ts (Temporary Diagnostic Code)

import * as http from 'http';

const PORT = process.env.SERVER_PORT || 9010;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Minimal server running.\n');
});

// Add the same process listeners here for maximum certainty
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRITICAL] Unhandled Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error(`💥 [CRITICAL] Uncaught Exception: ${err.message}`);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Node server running on port ${PORT}`);
});