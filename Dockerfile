# Improved multi-stage Dockerfile for Node.js (Node 18)
# Adjust build steps if your project outputs to a different folder or uses a different start command.

FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
# If your project has a build step (TypeScript, bundler), keep this:
RUN npm run build

# Runtime image
FROM node:18-alpine AS runtime

# create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# copy only necessary files
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --silent

# copy built output or source depending on your project
COPY --from=builder /app/dist ./dist
# Copy other runtime assets if needed (public, views, etc.)
# COPY --from=builder /app/public ./public

# set ownership for the non-root user and switch
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE ${PORT}
# Ensure this is your real start command (adjust path if different)
CMD ["node", "dist/index.js"]
