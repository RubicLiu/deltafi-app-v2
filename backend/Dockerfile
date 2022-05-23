FROM node:16

WORKDIR /usr/app

ADD package.json tsconfig.json yarn.lock /usr/app
ADD src /usr/app/src
RUN yarn install && yarn build

EXPOSE 4000
CMD [ "node", "dist/server.js" ]
