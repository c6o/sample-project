PATH_TO=$(dirname "$PWD/$0")

export CZ_ENV=development
export C6O_ENV=development
export NODE_ENV=development
export NODE_PATH=$PWD/../node-monorepo/packages/provisioner/.provisioners
if test -f "$PWD/../node-monorepo/dev-kubeconfig.yml"; then
  export KUBECONFIG=$PWD/../node-monorepo/dev-kubeconfig.yml
elif test -f "$PWD/../node-monorepo/dev-kubeconfig.yaml"; then
  export KUBECONFIG=$PWD/../node-monorepo/dev-kubeconfig.yaml
fi
# The following is optional
#export DEBUG=-engine*,-nodemon*,-*expo*,-babel*,-winston*,-elasticsearch*
export HUB_MONGODB_TEST_URL=mongodb://localhost:27017/traxitt-hub-test
export HUB_SERVER_URL=https://develop.codezero.io
export HUB_LOGIN_URL=https://develop.codezero.io

unset LOG_ELASTIC_CONNECTION LOG_CONSOLE LOG_LEVEL
