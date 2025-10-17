# Use Bun image
FROM oven/bun:latest

# Working directory inside the container (you can name it anything)
WORKDIR /

# Copy monorepo files
COPY package.json turbo.json bun.lockb ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies
RUN bun install

# Build all apps/packages
RUN bun run build

# Expose ports for apps
EXPOSE 3000  # frontend
EXPOSE 3001  # backend
EXPOSE 3002  # service

# Start all apps (dev mode)
CMD ["bun", "run", "dev"]
