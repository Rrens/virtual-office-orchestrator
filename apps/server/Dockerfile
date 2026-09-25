FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json turbo.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/server/package*.json ./apps/server/

RUN npm install

COPY packages/shared/ ./packages/shared/
COPY apps/server/ ./apps/server/

RUN npm run build --workspace=@virtual-office/shared
RUN cd apps/server && npx prisma generate
RUN cd apps/server && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/node_modules ./node_modules

USER node

EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]
