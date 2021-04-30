#!/usr/bin/env sh
set -eu
echo URL: ${HALYARD_BACKEND}
envsubst '${HALYARD_BACKEND}' < /usr/share/nginx/html/index.html.template > /usr/share/nginx/html/index.html && \
envsubst '${HALYARD_BACKEND}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"