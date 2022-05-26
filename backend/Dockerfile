FROM node:16

ARG build_command

WORKDIR /usr/app

ADD package.json tsconfig.json yarn.lock /usr/app
RUN yarn install

ADD src /usr/app/src
RUN yarn ${build_command}

EXPOSE 4000
CMD [ "node", "dist/server.js" ]
