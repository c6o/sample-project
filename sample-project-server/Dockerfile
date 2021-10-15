FROM node:14.0.0-alpine3.10 as nodebuild
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
#RUN yarn test --coverage

FROM node:14.0.0-alpine3.10 as noderun

WORKDIR /usr/src/app

COPY package.json ./

RUN yarn install --production
COPY --from=nodebuild /usr/src/app/server.js ./

EXPOSE 3000

CMD ["npm","run","start"]