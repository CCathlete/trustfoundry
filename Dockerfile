# ----------------------------------------------------------------------
# STAGE 1: Frontend Build (Vite/React/Vue)
# Builds the static assets into /app/frontend/dist
# ----------------------------------------------------------------------
FROM node:20-alpine AS frontend_builder

WORKDIR /app/frontend

# Copy package files first for better build-cache utilization
COPY frontend/package*.json ./
# Install ALL dependencies (including devDependencies for building)
RUN npm ci --loglevel=error

# Copy the rest of the source code and run the build command
COPY frontend .
RUN npm run build 

# ----------------------------------------------------------------------
# STAGE 2: Backend Dependencies (Only Production)
# Installs necessary production node_modules for the backend
# ----------------------------------------------------------------------
FROM node:20-alpine AS backend_deps

WORKDIR /app/backend

# Copy dependency files first
COPY backend/package*.json ./
# Install ONLY production dependencies to keep the image small
RUN npm ci --loglevel=error --only=production

# ----------------------------------------------------------------------
# FINAL STAGE: Nginx & Node.js Production Image
# Uses Nginx as the base, installs Node.js, and runs both services
# ----------------------------------------------------------------------

FROM nginx:alpine

# Install Node.js runtime environment and Bash (for the entrypoint script)

RUN apk add --no-cache nodejs npm bash gettext

# 1. Configuration Setup
# Copy the Nginx config template for routing (the sh script would edit env vars and create the nginx.conf file).
COPY nginx.conf.template /etc/nginx/conf.d/
# Copy the multi-service startup script.
COPY multi-service-entrypoint.sh /usr/local/bin/

# 2. Frontend Static Files (Served by Nginx)
# Nginx's default serving directory is /usr/share/nginx/html
COPY --from=frontend_builder /app/frontend/dist /usr/share/nginx/html

# 3. Backend Code and Dependencies (Run by Node)
WORKDIR /app/backend
# Copy production dependencies (from Stage 2)
COPY --from=backend_deps /app/backend/node_modules ./node_modules
# Copy compiled backend code (dist) and package.json for info
COPY backend/dist ./dist
COPY backend/package.json .

# Set necessary environment variables
ENV NODE_ENV=production

# Expose the Nginx port (external traffic)
EXPOSE 80

# Use the custom entrypoint script to run both services
ENTRYPOINT ["bash", "/usr/local/bin/multi-service-entrypoint.sh"]
