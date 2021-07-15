# CodeZero Halyard

## Halyard Demo Functionality

A project for experimenting with developer productivity.

The project contains a minimum set of features for experimentation with CodeZero's Teleport and Intercept debugging tools:

* 1 Front Ends
  * halyard-frontend
* 3 Back Ends
  * halyard-backend
  * halyard-sockets
  * echo-server from git@github.com:robblovell/echo-server.git that builds the docker container: robblovell/echo-server:2.2
* Database
  * halyard-database from a mongodb container

Technologies:

* Dockerized
* Kubernetes
* CodeZero

## What to do to try out Teleport and Intercept.

### Setup
First, install the CodeZero command with

```bash
yarn global add @c6o/cli
```
Second, deploy the project to a Kubernetes cluster so that you have a remote system to interact with through Teleport and Intercept.

```bash
kubeclt create namespace halyard
kubectl apply -n halyard -f ./k8s 
```

### Teleport

This will run the halyard project's components in the cluster in the namespace 'halyard'.

Say you want to run the halyard-frontend and talk to the halyard-backend in the cloud. Issue the following command
to access halyard-backend as if your local machine is in the cloud.

```bash
czctl deployment teleport halyard-backend -n halyard -l 3010
```

Now you can curl the halyard-backend:
```bash
curl -X GET http://halyard-backend:3000
```
Thes paths will route to the backend server:

```bash
curl -X GET http://halyard-frontend/api
curl -X GET http://halyard-frontend/ping
curl -X GET http://halyard-sail/api
curl -X GET http://halyard-sail/ping
curl -X GET http://halyard-sail/sail
```

It will reply:
```bash
{"data":"Halyard-Backend: Version 1.0"}
```

### Intercept

Now, let's run halyard-backend locally and have the server side traffic sent to this local service.

Run the halyard-backend locally on port 3010 with version 3010

```bash
cd halyard-backend
export HALYARD_VERSION=version 3010
export HALYARD_API_PORT=3010
npm start
```
It will have trouble connecting to the database, just ignore this problem for now.
```bash
> halyard-backend@1.0.0 start
> node server.js

listening on 3010
version  version 3010
```

Now run intercept:
```bash
czctl service intercept halyard-backend -n halyard -l 3010
```

At this point a curl to the remote front end path of /api, and /ping (or /sail for the sail frontend)
will with a header key/value of X-C6O-INTERCEPT=YES will direct to the locally 
running backend server.

```bash
> curl -H "X-C6O-INTERCEPT:YES" -L -X GET http://halyard-frontend/ping --silent
{"data":"Halyard-Backend: version 3010"}
```
Or directly to the backend server:
```bash
> curl -H "X-C6O-INTERCEPT:YES" -L -X GET http://halyard-backend:3000/ping --silent
{"data":"Halyard-Backend: version 3010"}
```

# Development Details

## Running the code locally
To run the code locally, you can start each server individually. Each backend service uses environment
variables with useful defaults if you don't specifiy anything. These should be started up in the following
order:

```
halyard-database | halyard-echo | halyard-backend | halyard-sockets | halyard-frontend | halyard-sail
```

### halyard-database

This is just a plain mongodb database with default configuration running on port 27017. You can run 
this locally or in a docker container.

It's not necessary to run the database locally to make the backend work. The halyard-backend will startup with an
error that it could not connect and report this in any responses to requests to /api.

### halyard-echo

The code for halyard-echo is in git@github.com:robblovell/echo-server.git. This can be run in a docker container locally
or you can checkout the echo server project and run it.  

The backend server in this project is setup to talk to echo server on port 8080 by
default.

It's not necessary to run the echo server locally to make the backend work. The halyard-backend will report 
that it could not get anything from echo server in any responses to requests to /api.

### halyard-backend

The halyard backend is a server that is used to test connectivity between internal kubernetes pods and external local
development environments. It starts up and tries to connect to halyard-database and records if it could connect or not.

`/api` In subsequent requests to /api, it reports the status of the connection to the database, makes a request to halyard-echo
and reports back any responses from echo server.
`/` Is used as ping that reports the version deployed

Enviroment variables:
```bash
HALYARD_ECHO || 'http://localhost:8000'
HALYARD_DATABASE || 'mongodb://localhost:27017'
HALYARD_API_PORT || 3000
HALYARD_API_HOST || 'localhost'
HALYARD_VERSION || 'Version 1.0'
```

### halyard-sockets

The halyard sockets is a server that is used to test websocket connectivity between internal kubernetes pods and 
external local development environments. It's purpose is to interact with the frontend through web sockets. The
code has implemented a broadcast mechanism when any messages is prefixed with 'boradcast:' all connected sockets
receive the message.  A socket, once opened, is pinged periodically with a message with "PING" in it.

Environment Variables:

```bash
HALYARD_PING_INTERVAL || 5000
HALYARD_PINGPONGFAIL_INTERVAL || 10000
HALYARD_SOCKETS_PORT || 8999
```
### halyard-frontend && halyard-sails

The halyard frontend is a webpage that makes requests to the halyard backend /api endpoint and reports back the results
to a browser window. It also opens a websocket connection to halyard sockets and prints out the messages it received.

The halyard frontend proxies http and websocket connections to the halyard-backend and halyard-sockets backend servers
through an NGINX proxy. Requests to websockets go to halyard-sockets, requests to `/api` go to halyard-backend. `/` 
returns the frontend html.

The sail server has a different web experience and relies on the backend endpoint /sail.

## Operating manifest items

```bash
docker run -d -h localhost -p 27017:27017 --name mongo mongo
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```

## Containerizing, Publishing

### Containerizing

#### composer builds:

** untested **
```bash
docker-compose build
docker-compose push
```

#### manual builds:
```bash
docker build --tag halyard-database:1.5 ./halyard-database
docker build --tag halyard-backend:1.5 ./halyard-backend
docker build --tag halyard-sockets:1.5 ./halyard-sockets
docker build --tag halyard-frontend:1.5 ./halyard-frontend
docker build --tag halyard-sails:1.5 ./halyard-frontend
```

#### building from an M1 machine for remote systems:

```bash
docker build --tag robblovell/halyard-backend:1.5 --platform linux/amd64 ./halyard-backend --no-cache
docker build --tag robblovell/halyard-sockets:1.5 --platform linux/amd64 ./halyard-sockets --no-cache
docker build --tag robblovell/halyard-frontend:1.5 --platform linux/amd64 ./halyard-frontend -f ./halyard-frontend/Dockerfile.confgMap
docker build --tag robblovell/halyard-sails:1.5 --platform linux/amd64 ./halyard-sails -f ./halyard-sails/Dockerfile.confgMap
```
Other architectures:
```bash
... --platform linux/amd64 --platform linux/arm64 --platform linux/arm64/v8 
```

#### build for running on M1:

```bash
docker build --tag robblovell/halyard-backend:1.5 --platform linux/arm64 ./halyard-backend --no-cache
docker build --tag robblovell/halyard-sockets:1.5 --platform linux/arm64 ./halyard-sockets --no-cache
docker build --tag robblovell/halyard-frontend-local:1.5 --platform linux/arm64 ./halyard-frontend -f ./halyard-frontend/Dockerfile
docker build --tag robblovell/halyard-sails-local:1.5 --platform linux/arm64 ./halyard-sails -f ./halyard-sails/Dockerfile
```

### Publishing

```bash
docker push robblovell/halyard-backend:1.5
docker push robblovell/halyard-sockets:1.5
docker push robblovell/halyard-frontend:1.5
docker push robblovell/halyard-sails:1.5
```

### publish to docker hub

```bash
docker tag e3053bf8c609 robblovell/halyard-backend:1.5
docker tag f2cf0963cccd robblovell/halyard-frontend:1.5
docker push robblovell/halyard-backend:1.5
docker push robblovell/halyard-frontend:1.5
etc.
```

## Running
### Locally

#### Database and echo server

This can be started in a docker container and made available to localhost.  Note, echo server cannot run on port 80 
locally because of operating system level protection of ports < 1024.

Running echo server:
```bash
docker run -p 8000:8080 --detach --name halyard-echo robblovell/echo-server:2.2
```

MongoDB:

```bash
docker run --name mongodb -d mongo:latest
```

or
```bash
docker run --name mongodb -d mongo:4.0.25
```

#### halyard-backend

The halyard backend will start with errors if a database is not running, but will function without
the database, just reporting that it could not connect in response to any requests that are made.
Similarly, if halyard echo server is not running, the backend will function and respond with what
errors we've received from echo server.


Here is how to start the backend on two different ports (3000 is default)
```bash
HALYARD_API_PORT=3010 HALYARD_ECHO='http://localhost:8000' yarn start-backend
HALYARD_API_PORT=3020 HALYARD_ECHO='http://localhost:8000' yarn start-backend
```
You can also set the variables `HALYARD_VERSION` when running the backend to alter the look of the
backend's replies and the front end web pages. When teleported, you will need to run the halyard backend on a port other
than 3000 because the remote server will be using this port.

```bash
HALYARD_VERSION=Version 2.0
```

#### halyard-sockets
```bash
yarn start-sockets
```

#### halyard-frontend

Since you don't have a local NGINX to forward requests to the backend, the frontend
index.html will need to be modified to talk directly to the backend service. You will not be able to 
run this service locally on port 80 as this port is < 1024 and is protected by your operating system.

You need to run this in a docker container to use NGINX forwarding.

docker run 8888:80 --detach --name halyard-frontend robblovell/halyard-frontend:1.5
docker run 8889:80 --detach --name halyard-sails robblovell/halyard-frontend:1.5

Or you can use your debugger and run a server to serve index.html, however you will need to run the backend 
outside of docker and change the url in the frontend or sails index.html file:

Run the backend:
```bash
yarn run start-backend
yarn run start-sockets
```
For frontend websockets:
```nashorn js
const loc = window.location
loc.host = 'localhost'
```
For frontend backend request:

```nashorn js
 const url = "http://localhost:3000/api"
```

For sails: 
```nashorn js
 const url = "http://localhost:3000/sails"
```

Or you can run teleport with intercept and use the remote server names of halyard-backend and halyard-sockets instead of localhost.
Be careful as when you teleport, there could be port collisions to deal with.

### With docker

To run with docker, a local network needs to be created and all containers started on this network.

```bash
docker network create halyard
docker run --network halyard -p 27017:27017 --name halyard-database -d mongo:4.4.5
docker run --network halyard -p 8000:8080 --detach --name halyard-echo robblovell/echo-server:2.2
docker run --network halyard -p 3000:3000 --detach --name halyard-backend --env HALYARD_VERSION='Version 3030' --env HALYARD_ECHO='http://halyard-echo:8000' --env HALYARD_DATABASE='mongodb://halyard-database:27017' robblovell/halyard-backend:1.5
docker run --network halyard -p 8999:8999 --detach --name halyard-sockets robblovell/halyard-sockets:1.5
docker run --network halyard -p 8888:80 --detach --name halyard-frontend robblovell/halyard-frontend-local:1.5
docker run --network halyard -p 8889:80 --detach --name halyard-sails robblovell/halyard-sails-local:1.5
```

With a teleport session running, port collisions will occur, so you need to change the ports docker exposes. Note
that the internal references within NGINX are within the docker network and talk to the internal container port. By
changing the port, you can intercept remote server side requests to these locally running services:

```bash
docker network create halyard
docker run --network halyard -p 27017:27017 --name halyard-database -d mongo:4.4.5
docker run --network halyard -p 8010:8080 --detach --name halyard-echo robblovell/echo-server:2.2
docker run --network halyard -p 3030:3000 --detach --name halyard-backend --env HALYARD_VERSION='Version 3010' --env HALYARD_ECHO='http://halyard-echo:8010' --env HALYARD_DATABASE='mongodb://halyard-database:27017' robblovell/halyard-backend:1.5
docker run --network halyard -p 8989:8999 --detach --name halyard-sockets robblovell/halyard-sockets:1.5
docker run --network halyard -p 8898:80 --detach --name halyard-frontend robblovell/halyard-frontend-local:1.5
docker run --network halyard -p 8899:80 --detach --name halyard-sails robblovell/halyard-sails-local:1.5
docker ps
```

So, you don't need to expose halyard-backend, halyard-sockets, halyard-echo or halyard-database 
unless you want to intercept into these services. Since halyard-frontend and halyard-sails are locally exposed services
they will need to have their ports changed when teleported to the remote server running these services.

```bash
docker network create halyard
docker run --network halyard --name halyard-database -d mongo:4.4.5
docker run --network halyard --detach --name halyard-echo robblovell/echo-server:2.2
docker run --network halyard --detach --name halyard-backend --env HALYARD_VERSION='Version 3010' --env HALYARD_ECHO='http://halyard-echo:8080' --env HALYARD_DATABASE='mongodb://halyard-database:27017' robblovell/halyard-backend:1.5
docker run --network halyard --detach --name halyard-sockets robblovell/halyard-sockets:1.5
docker run --network halyard -p 8898:80 --detach --name halyard-frontend robblovell/halyard-frontend-local:1.5
docker run --network halyard -p 8899:80 --detach --name halyard-sails robblovell/halyard-sails-local:1.5
docker ps
```

Now open `https://localhost:8003`

Cleaning up:

```bash
docker kill halyard-backend halyard-frontend halyard-database halyard-echo halyard-sockets halyard-sails
docker container prune -f && docker image prune -f 
docker network rm halyard
```

#### For a public echo server: 
```bash
docker run --network halyard -p 8080:8080 --detach --name echo echo-server:2.2
```

#### Docker crib notes:

Helpful Docker information:

[Useful article on docker networking](https://maximorlov.com/4-reasons-why-your-docker-containers-cant-talk-to-each-other/)

Useful commands:

```bash
docker exec -it [container] /bin/sh
docker network create [network]
docker network ls   
docker network rm [network]
docker network connect [network] [container]
docker exec [containerA] ping [containerB] -c2
docker inspect -f '{{.NetworkSettings.Networks.[network].IPAddress}}' [container]
```
## Configuration

The following environment variables are required:

```bash
export HALYARD_DATABASE=mongodb://localhost:8003
export HALYARD_DATABASE_DATABASE=database
export HALYARD_API_HOST=node-service
export HALYARD_API_PORT=8002
```

## Install

### Using Kubectl

```bash
kubectl apply -f ./k8s
```

### Using CodeZero

Legacy command
```bash
czctl install ./c6o/apps/halyard-database.yaml --local -n halyard
czctl install ./c6o/apps/halyard-echo.yaml --local -n halyard
czctl install ./c6o/apps/halyard-backend.yaml --local -n halyard
czctl install ./c6o/apps/halyard-sockets.yaml --local -n halyard
czctl install ./c6o/apps/halyard-frontend.yaml --local -n halyard
```

New command (not working yet):
```bash
czctl app install ./c6o/apps/halyard-database.yaml --local --namespace=halyard
czctl app install ./c6o/apps/halyard-echo.yaml --local --namespace=halyard
czctl app install ./c6o/apps/halyard-backend.yaml --local --namespace=halyard
czctl app install ./c6o/apps/halyard-sockets.yaml --local --namespace=halyard
czctl app install ./c6o/apps/halyard-frontend.yaml --local --namespace=halyard
```

Cleaning up 
```
kubectl delete app halyard-database -n halyard
kubectl delete app halyard-echo -n halyard
kubectl delete app halyard-backend -n halyard
kubectl delete app halyard-frontend -n halyard
```

#### useful kubernetes commands:

```bash
kubectl rollout restart deployment halyard-backend -n halyard
watch -n 5 kubectl get svc,deploy,cm,pod -n halyard -o wide
kubectl exec -it <pod> -n halyard -- sh
kubectl describe pod <pod> -n halyard
kubectl logs -n <pod>
kubectl get namespaces --show-labels
kubectl rollout restart deployment -n
```
## Halyard Deployment process

### Teleport

To setup a teleport session so that a local service can talk to the remote ones, use:

Teleport:
```bash
czctl deployment teleport halyard-backend -n halyard -f env.sh
```

Intercept
```bash
czctl service intercept halyard-backend -l 3030 -n halyard
```

Curl Commands

```bash
curl http://halyard-backend:3000 --silent
curl -H "X-C6O-INTERCEPT:YES" -L -X GET http://halyard-backend:3000/ping --silent
```

#### Based On: https://betterprogramming.pub/kubernetes-deployment-connect-your-front-end-to-your-back-end-with-nginx-7e4e7cfef177

