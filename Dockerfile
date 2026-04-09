FROM oven/bun:1.2-alpine

WORKDIR /app

COPY package.json bun.lockb ./

RUN bun install --frozen-lockfile --production

COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=production

EXPOSE 4000

CMD ["bun", "run", "src/index.ts"]
