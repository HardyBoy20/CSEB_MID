# Use the official Node.js runtime as base image
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling and security updates
RUN apk update && apk add --no-cache dumb-init && apk upgrade

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies with clean cache
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Create uploads directory for file uploads and set proper permissions
RUN mkdir -p public/uploads && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the port that the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check for container monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
# Start the application
CMD ["npm", "start"]
