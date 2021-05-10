#!/usr/bin/env sh
set -eu
echo URL: ${HALYARD_BACKEND_HOST}
envsubst '${HALYARD_BACKEND_HOST}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html && \
envsubst '${HALYARD_BACKEND_HOST}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"