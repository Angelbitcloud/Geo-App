FROM node:20 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install && npm install -g typescript

COPY . .

RUN npx tsc -p tsconfig.build.json

FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
