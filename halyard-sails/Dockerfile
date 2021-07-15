FROM nginx:1.17.10-alpine
# RUN apk add nano && apk add curl

# Bundle up the front end.
COPY ./index.html /usr/share/nginx/html
COPY ./yacht-sails-down.png /usr/share/nginx/html
COPY ./yacht-sails-up.png /usr/share/nginx/html
COPY ./yacht-sails-error.png /usr/share/nginx/html
# Configure nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80