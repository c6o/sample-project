#!/usr/bin/env sh
set -eu

envsubst '${API_HOST} ${API_PORT}' < ./nginx.conf.template > ./nginx.conf

exec "$@"