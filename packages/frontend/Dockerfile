FROM nginx:1.17.10-alpine

# Bundle up the front end.
COPY ./index.html /usr/share/nginx/html
COPY ./index.js /usr/share/nginx/html
COPY ./index.css /usr/share/nginx/html
COPY ./c6o.png /usr/share/nginx/html

# Configure nginx
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80