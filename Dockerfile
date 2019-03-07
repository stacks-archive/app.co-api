# app.co-api - 20min build
FROM node:10.14.2-alpine as base
# FROM blockstack/node:latest as base
WORKDIR /usr/src
COPY package.json yarn.lock /usr/src/
RUN apk add \
  --repository http://dl-cdn.alpinelinux.org/alpine/edge/testing \
  --repository http://dl-cdn.alpinelinux.org/alpine/edge/main \
  --update-cache \
  python \
  py-pip \
  make \
  g++ \
  vips-dev
RUN yarn install && apk del \
  python \
  py-pip \
  make \
  g++ 
COPY . .
RUN yarn --production

FROM node:10.14.2-alpine
# FROM blockstack/node:latest
WORKDIR /usr/src
ENV NODE_ENV="production"
COPY --from=base /usr/src .
EXPOSE 4000
CMD ["node", "./server"]
