FROM node:16

WORKDIR /usr/app

ADD package.json tsconfig.json yarn.lock /usr/app
RUN yarn install

ADD src /usr/app/src
RUN yarn build

EXPOSE 4000
ENTRYPOINT [ "node", "dist/server.js" ]
