FROM node:14.0.0-alpine3.10
WORKDIR /usr/src/app
COPY . .
RUN yarn install --production
EXPOSE 8999
CMD ["node", "index.js"]