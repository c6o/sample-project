FROM node:14.0.0-alpine3.10
WORKDIR /usr/src/app
COPY . .
RUN yarn install --production
EXPOSE 3000
CMD ["node", "index.js"]