# Stage 1: Build the application using bun
FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lockb bun.lockb

RUN bun install

# Copy the source code
COPY ./src ./src

# Copy the .env file into the build stage (optional, if needed during build)
COPY .env .env

# Set environment variable for production
ENV NODE_ENV=production

RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile server \
    ./src/index.ts

# Stage 2: Final image with distroless
FROM gcr.io/distroless/base

WORKDIR /app

# Copy the built server from the build stage
COPY --from=build /app/server server

#  Copy the .env file from the build stage (so it's available at runtime)
# COPY --from=build /app/.env .env

# Set environment variable for production in the final image
ENV NODE_ENV=production

# Start the server
CMD ["./server"]

EXPOSE 4000
