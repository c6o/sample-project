#!/usr/bin/env sh
set -eu
echo URL: ${HALYARD_APIHOST}:${HALYARD_APIPORT}
envsubst '${HALYARD_APIHOST} ${HALYARD_APIPORT}' < /etc/nginx/conf.d/nginx.conf.template > /etc/nginx/conf.d/nginx.conf && \

exec "$@"