FROM node:20.9.0-bullseye-slim AS builder

ENV NODE_ENV production
RUN corepack enable
RUN pnpm install --frozen-lockfile && pnpm build

RUN mkdir /app
WORKDIR /app

COPY . .

FROM node:20.9.0-bullseye-slim

LABEL fly_launch_runtime="nodejs"
COPY --from=builder /app /app
RUN apt-get update && apt-get install ffmpeg -y

WORKDIR /app
ENV NODE_ENV production

ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

CMD [ "node", "dist/index.js" ]
