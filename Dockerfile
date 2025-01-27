FROM debian:bookworm AS builder

RUN apt update && apt install -y \
    curl \
    # the @discordjs/opus package isn't fetching the prebuilt binary, so we need these to manually build it
    python3 \
    make \
    build-essential

ENV NVM_VERSION 0.39.7
ENV NODE_VERSION 20.18.2
ENV NVM_DIR /usr/local/nvm
RUN mkdir $NVM_DIR
RUN curl -o- "https://raw.githubusercontent.com/creationix/nvm/v${NVM_VERSION}/install.sh" | bash
ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
RUN echo "source $NVM_DIR/nvm.sh && \
    nvm install $NODE_VERSION && \
    nvm alias default $NODE_VERSION && \
    nvm use default" | bash

ENV NODE_ENV dev
RUN corepack enable

RUN mkdir /app
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:20.18.2-bookworm-slim

LABEL fly_launch_runtime="nodejs"
COPY --from=builder /app /app
RUN apt update && apt install ffmpeg -y

WORKDIR /app
ENV NODE_ENV production

ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

CMD [ "node", "dist/index.js" ]
