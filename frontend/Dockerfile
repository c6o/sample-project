FROM nginx:1.17.10-alpine
RUN apk add nano && apk add curl

# Bundle up the front end.
COPY ./index.html /usr/share/nginx/html

# Configure nginx
COPY ./nginx.conf.template /

RUN \
rm -rf /etc/nginx/conf.d/default.conf && \
envsubst '${API_HOST} ${API_PORT}' < /nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \
rm -f /nginx.conf.template

EXPOSE 80


