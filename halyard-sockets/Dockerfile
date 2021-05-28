FROM node:14.0.0-alpine3.10 as nodebuild
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm test

FROM node:14.0.0-alpine3.10 as noderun

WORKDIR /usr/src/app

COPY package*json ./

RUN npm install --only=production
COPY --from=nodebuild /usr/src/app/server.js ./
CMD ["npm","run","start"]