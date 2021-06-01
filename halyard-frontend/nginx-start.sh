#!/usr/bin/env sh
set -eu
echo BACKEND_URL: ${HALYARD_API_HOST}:${HALYARD_API_PORT}
echo SOCKETS_URL: ${HALYARD_SOCKETS_HOST}:${HALYARD_SOCKETS_PORT}
envsubst '${HALYARD_API_HOST} ${HALYARD_API_PORT} ${HALYARD_SOCKETS_HOST} ${HALYARD_SOCKETS_PORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"