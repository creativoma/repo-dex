FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build

FROM base AS runner
COPY --from=build /app/build ./build
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
ENV PORT=3000

CMD ["node_modules/.bin/react-router-serve", "./build/server/index.js"]
