// shims.js

import path from 'path';
import { fileURLToPath } from 'url';

// Fix for Node.js global variables in a bundled context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
global.global = global;