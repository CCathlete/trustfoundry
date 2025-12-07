#!/bin/sh

# 1. Nginx will use (BACKEND_PORT)
# It uses the $API_PORT provided by the environment, **defaulting to 3000** if not set.
export BACKEND_PORT=${API_PORT:-3000}

# 2. Set the SERVER_PORT variable for the Node.js application
# This ensures the Node app has a $PORT variable to read, even if one wasn't passed by Docker.
export SERVER_PORT=${BACKEND_PORT}
#
# The following MinIO variables are automatically inherited by the Node.js process 
# from the environment (passed via `docker run -e ...` / docker-compose.yaml / terraform env):
# MINIO_ENDPOINT
# MINIO_PORT
# MINIO_ACCESS_KEY
# MINIO_SECRET_KEY
# MINIO_BUCKET_NAME
# MINIO_USESSL

# 3. Substitute the variable into the Nginx template 
envsubst '$$BACKEND_PORT' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/default.conf

# 4. Start the Node.js backend server in the background
# The 'node' process inherits the exported $SERVER_PORT variable.
node /app/backend/dist/index.cjs &

# 5. Start Nginx in the foreground
nginx -g "daemon off;"
