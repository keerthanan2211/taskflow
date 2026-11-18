# ---- build stage ----
FROM node:20-alpine AS build
# Prisma's query engine needs OpenSSL on Alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage ----
FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./
EXPOSE 4000
# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
