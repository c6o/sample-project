#!/usr/bin/env sh
set -eu
echo URL: ${API_HOST}:${API_PORT}
envsubst '${API_HOST} ${API_PORT}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html && \
envsubst '${API_HOST} ${API_PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"