FROM node:14.0.0-alpine3.10 as nodebuild
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
#RUN yarn test

FROM node:14.0.0-alpine3.10 as noderun

WORKDIR /usr/src/app

COPY package*json ./
EXPOSE 8999
RUN yarn install --only=production
COPY --from=nodebuild /usr/src/app/server.js ./
CMD ["npm","run","start"]