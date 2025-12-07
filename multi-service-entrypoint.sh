#!/bin/sh

# 1. Nginx will use (BACKEND_PORT)
# It uses the $PORT provided by the environment, **defaulting to 4000** if not set.
export BACKEND_PORT=${PORT:-4000}

# 2. Set the PORT variable for the Node.js application
# This ensures the Node app has a $PORT variable to read, even if one wasn't passed by Docker.
export PORT=${BACKEND_PORT}

# 3. Substitute the variable into the Nginx template 
envsubst '$$BACKEND_PORT' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# 4. Start the Node.js backend server in the background
# The 'node' process inherits the exported $PORT variable.
node /app/backend/dist/index.cjs &

# 5. Start Nginx in the foreground
nginx -g "daemon off;"
