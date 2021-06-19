# CodeZero Halyard

A project for experimenting with developer productivity.

A minimum set of features for CI/CD experimentation:

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

## Running the code locally

To run the code locally, you can start each server individually. Each backend service uses environment
variables with useful defaults if you don't specifiy anything. These should be started up in the following
order:

```
halyard-database | halyard-echo | halyard-backend | halyard-sockets | halyard-frontend
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
### halyard-frontend

The halyard frontend is a webpage that makes requests to the halyard backend /api endpoint and reports back the results
to a browswer window. It also opens a websocket connection to halyard sockets and prints out the messages it received.

The halyard frontend proxies http and websocket connections to the halyard-backend and halyard-sockets backend servers
through an NGINX proxy. Requests to websockets go to halyard-sockets, requests to `/api` go to halyard-backend. `/` 
returns the frontend html.

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
docker build --tag halyard-database ./halyard-database:1.3
docker build --tag halyard-backend ./halyard-backend:1.3
docker build --tag halyard-sockets ./halyard-sockets:1.3
docker build --tag halyard-frontend ./halyard-frontend:1.3
```

#### M1 build for remote systems:
```bash
docker build --tag robblovell/halyard-backend:1.5 --platform linux/amd64 ./halyard-backend --no-cache
docker build --tag robblovell/halyard-sockets:1.3 --platform linux/amd64 ./halyard-sockets --no-cache
docker build --tag robblovell/halyard-frontend:1.5 --platform linux/amd64 ./halyard-frontend -f ./halyard-frontend/Dockerfile.confgMap
docker build --tag robblovell/halyard-frontend:1.4 --platform linux/amd64 ./halyard-frontend -f ./halyard-frontend/Dockerfile.confgMap
```
Other architectures:
```bash
... --platform linux/amd64 --platform linux/arm64 --platform linux/arm64/v8 
```

### Publishing

```bash
docker push robblovell/halyard-backend:1.5
docker push robblovell/halyard-sockets:1.3
docker push robblovell/halyard-frontend:1.3
docker push robblovell/halyard-frontend:1.4
docker push robblovell/halyard-frontend2:1.3
docker push robblovell/halyard-frontend:1.5
```

### publish to docker hub

```bash
docker tag e3053bf8c609 robblovell/halyard-backend:1.1
docker tag f2cf0963cccd robblovell/halyard-frontend:1.1
docker push robblovell/halyard-backend:1.1
docker push robblovell/halyard-frontend:1.1
```

## Running
### Locally

#### Database and echo server

This can be started in a docker container and made available to localhost.  Note, echo server cannot run on port 80 
locally because of operating system level protection of ports < 1024.

Running echo server:

docker run -p 8000:8080 --detach --name halyard-echo robblovell/echo-server:2.2


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
errors were received from echo server.


Here is how to start the backend on two different ports (3000 is default)
```bash
HALYARD_API_PORT=3010 HALYARD_ECHO='http://localhost:8000' yarn start-backend
HALYARD_API_PORT=3020 HALYARD_ECHO='http://localhost:8000' yarn start-backend
```

#### halyard-sockets
```bash
yarn start-sockets
```

#### halyard-frontend

Since you don't have a local NGINX to forward requests to the backend, the frontend
index.html will need to be modified to talk directly to the backend service. You will not be able to 
run this service locally on port 80 as this port is < 1024 and is protected by your operating system.

You can also run this in a docker container to use NGINX forwarding.

docker run 8888:80 --detach --name halyard-frontend --env HALYARD_API_HOST='localhost' --env HALYARD_API_PORT='3010' robblovell/halyard-frontend:1.3
docker run 8889:80 --detach --name halyard-frontend --env HALYARD_API_HOST='localhost' --env HALYARD_API_PORT='3020' robblovell/halyard-frontend:1.3

```bash
yarn start-frontend
```

### With docker

To run with docker, a local network needs to be created and all containers started on this network.

```bash
docker network create halyard
docker run --network halyard -p 27017:27017 --name halyard-database -d mongo:4.4.5
docker run --network halyard -p 8000:8080 --detach --name halyard-echo robblovell/echo-server:2.2
docker run --network halyard -p 8001:3000 --detach --name halyard-backend --env HALYARD_API_PORT='3000' --env HALYARD_ECHO='http://halyard-echo:8080' --env HALYARD_DATABASE='mongodb://halyard-database:27017' robblovell/halyard-backend:1.3
docker run --network halyard -p 8002:8999 --detach --name halyard-sockets --env HALYARD_SOCKETS_PORT='8999' robblovell/halyard-sockets:1.3
docker run --network halyard -p 8003:80 --detach --name halyard-frontend --env HALYARD_API_HOST='halyard-backend' --env HALYARD_API_PORT='8001' --env HALYARD_SOCKETS_HOST='halyard-sockets' --env HALYARD_SOCKETS_PORT='8002' robblovell/halyard-frontend:1.3
```

Now open `https://localhost:8003`

Cleaning up:

```bash
docker kill halyard-backend halyard-frontend halyard-database halyard-echo halyard-sockets
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

```bash
kubectl apply -f ./k8s/halyard-backend-deployment.yaml
kubectl apply -f ./k8s/halyard-backend-service.yaml
kubectl apply -f ./k8s/halyard-database-deployment.yaml
kubectl apply -f ./k8s/halyard-database-service.yaml
kubectl apply -f ./k8s/halyard-frontend-deployment.yaml
kubectl apply -f ./k8s/halyard-frontend-service.yaml
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
sudo -E czctl deployment teleport halyard-backend -n halyard -f env.sh
```

Intercept
```bash
czctl service intercept halyard-backend -p 3000 -o 3010 -n halyard -x X-LOCAL:true
```

Curl Commands

```bash
curl http://halyard-backend:3000 --silent
curl http://halyard-backend:3010 --silent
curl http://halyard-backend:3020 --silent
curl -H "X-LOCAL:true" -L -X GET http://159.203.52.118/api
```

#### Based On: https://betterprogramming.pub/kubernetes-deployment-connect-your-front-end-to-your-back-end-with-nginx-7e4e7cfef177

