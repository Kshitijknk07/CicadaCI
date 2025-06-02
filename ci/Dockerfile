FROM node:18-alpine

WORKDIR /ci

RUN apk add --no-cache docker-cli

RUN npm install -g pnpm typescript

COPY package*.json pnpm-lock.yaml* ./

RUN pnpm install

COPY . .

RUN pnpm run build

RUN pnpm prune --prod

EXPOSE 3000

CMD ["node", "dist/index.js"]
