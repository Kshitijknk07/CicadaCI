# Use Node.js 18 Alpine with PNPM pre-installed
FROM node:18-alpine

# Install PNPM globally
RUN npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build the app (if needed)
RUN pnpm run build

# Expose the app port
EXPOSE 3000

# Run the app
CMD ["pnpm", "start"]