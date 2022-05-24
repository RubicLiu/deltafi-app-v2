FROM node:16 as build

WORKDIR /usr/app

ADD package.json tsconfig.json yarn.lock /usr/app
RUN yarn install

ADD src /usr/app/src
ADD public /usr/app/public
RUN yarn build-dev

FROM nginx:latest
COPY --from=build /usr/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80