#!/usr/bin/env sh
set -eu
echo URL: ${HALYARD_API_HOST}:${HALYARD_API_PORT}
envsubst '${HALYARD_API_HOST} ${HALYARD_API_PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"