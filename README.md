# CodeZero Halyard

A project for experimenting with developer productivity.

A minimum set of features for CI/CD experimentation:

* 1 Front Ends
  * sample-project-web
* 3 Back Ends
  * sample-project-server
  * sample-project-sockets
  * echo-server from git@github.com:robblovell/echo-server.git that builds the docker container: robblovell/echo-server:2.2
* Database
  * sample-project-database from a mongodb container

Technologies:

* Dockerized
* Kubernetes
* CodeZero

## Running the code locally

To run the code locally, you can start each server individually. Each backend service uses environment
variables with useful defaults if you don't specifiy anything. These should be started up in the following
order:

```
sample-project-database | sample-project-echo | sample-project-server | sample-project-sockets | sample-project-web
```

### sample-project-database

This is just a plain mongodb database with default configuration running on port 27017. You can run 
this locally or in a docker container.

It's not necessary to run the database locally to make the backend work. The sample-project-server will startup with an
error that it could not connect and report this in any responses to requests to /api.

### sample-project-echo

The code for sample-project-echo is in git@github.com:robblovell/echo-server.git. This can be run in a docker container locally
or you can checkout the echo server project and run it.  

The backend server in this project is setup to talk to echo server on port 8080 by
default.

It's not necessary to run the echo server locally to make the backend work. The sample-project-server will report
that it could not get anything from echo server in any responses to requests to /api.

### sample-project-server

The halyard backend is a server that is used to test connectivity between internal kubernetes pods and external local
development environments. It starts up and tries to connect to sample-project-database and records if it could connect or not.

`/api` In subsequent requests to /api, it reports the status of the connection to the database, makes a request to sample-project-echo
and reports back any responses from echo server.
`/` Is used as ping that reports the version deployed

Enviroment variables:
```bash
SAMPLE_PROJECT_ECHO || 'http://localhost:8000'
SAMPLE_PROJECT_DATABASE || 'mongodb://localhost:27017'
SAMPLE_PROJECT_API_PORT || 3000
SAMPLE_PROJECT_API_HOST || 'localhost'
SAMPLE_PROJECT_VERSION || 'Version 1.0'
```

### sample-project-sockets

The halyard sockets is a server that is used to test websocket connectivity between internal kubernetes pods and 
external local development environments. It's purpose is to interact with the frontend through web sockets. The
code has implemented a broadcast mechanism when any messages is prefixed with 'boradcast:' all connected sockets
receive the message.  A socket, once opened, is pinged periodically with a message with "PING" in it.

Environment Variables:

```bash
SAMPLE_PROJECT_PING_INTERVAL || 5000
SAMPLE_PROJECT_PINGPONGFAIL_INTERVAL || 10000
SAMPLE_PROJECT_SOCKETS_PORT || 8999
```
### sample-project-web

The halyard frontend is a webpage that makes requests to the halyard backend /api endpoint and reports back the results
to a browswer window. It also opens a websocket connection to halyard sockets and prints out the messages it received.

The halyard frontend proxies http and websocket connections to the sample-project-server and sample-project-sockets backend servers
through an NGINX proxy. Requests to websockets go to sample-project-sockets, requests to `/api` go to sample-project-server. `/`
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
docker build --tag sample-project-database ./sample-project-database:1.3
docker build --tag sample-project-server ./sample-project-server:1.3
docker build --tag sample-project-sockets ./sample-project-sockets:1.3
docker build --tag sample-project-web ./sample-project-web:1.3
```

#### M1 build for remote systems:
```bash
docker build --tag robblovell/sample-project-server:1.5 --platform linux/amd64 ./sample-project-server --no-cache
docker build --tag robblovell/sample-project-sockets:1.3 --platform linux/amd64 ./sample-project-sockets --no-cache
docker build --tag robblovell/sample-project-web:1.5 --platform linux/amd64 ./sample-project-web -f ./sample-project-web/Dockerfile.confgMap
docker build --tag robblovell/sample-project-web:1.4 --platform linux/amd64 ./sample-project-web -f ./sample-project-web/Dockerfile.confgMap
```
Other architectures:
```bash
... --platform linux/amd64 --platform linux/arm64 --platform linux/arm64/v8 
```

### Publishing

```bash
docker push robblovell/sample-project-server:1.5
docker push robblovell/sample-project-sockets:1.3
docker push robblovell/sample-project-web:1.3
docker push robblovell/sample-project-web:1.4
docker push robblovell/sample-project-web2:1.3
docker push robblovell/sample-project-web:1.5
```

### publish to docker hub

```bash
docker tag e3053bf8c609 robblovell/sample-project-server:1.1
docker tag f2cf0963cccd robblovell/sample-project-web:1.1
docker push robblovell/sample-project-server:1.1
docker push robblovell/sample-project-web:1.1
```

## Running
### Locally

#### Database and echo server

This can be started in a docker container and made available to localhost.  Note, echo server cannot run on port 80 
locally because of operating system level protection of ports < 1024.

Running echo server:

docker run -p 8000:8080 --detach --name sample-project-echo robblovell/echo-server:2.2


MongoDB:

```bash
docker run --name mongodb -d mongo:latest
```

or
```bash
docker run --name mongodb -d mongo:4.0.25
```

#### sample-project-server

The halyard backend will start with errors if a database is not running, but will function without
the database, just reporting that it could not connect in response to any requests that are made.
Similarly, if halyard echo server is not running, the backend will function and respond with what
errors were received from echo server.


Here is how to start the backend on two different ports (3000 is default)
```bash
SAMPLE_PROJECT_API_PORT=3010 SAMPLE_PROJECT_ECHO='http://localhost:8000' yarn start-backend
SAMPLE_PROJECT_API_PORT=3020 SAMPLE_PROJECT_ECHO='http://localhost:8000' yarn start-backend
```

#### sample-project-sockets
```bash
yarn start-sockets
```

#### sample-project-web

Since you don't have a local NGINX to forward requests to the backend, the frontend
index.html will need to be modified to talk directly to the backend service. You will not be able to 
run this service locally on port 80 as this port is < 1024 and is protected by your operating system.

You can also run this in a docker container to use NGINX forwarding.

docker run 8888:80 --detach --name sample-project-web --env SAMPLE_PROJECT_API_HOST='localhost' --env SAMPLE_PROJECT_API_PORT='3010' robblovell/sample-project-web:1.3
docker run 8889:80 --detach --name sample-project-web --env SAMPLE_PROJECT_API_HOST='localhost' --env SAMPLE_PROJECT_API_PORT='3020' robblovell/sample-project-web:1.3

```bash
yarn start-frontend
```

### With docker

To run with docker, a local network needs to be created and all containers started on this network.

```bash
docker network create halyard
docker run --network halyard -p 27017:27017 --name sample-project-database -d mongo:4.4.5
docker run --network halyard -p 8000:8080 --detach --name sample-project-echo robblovell/echo-server:2.2
docker run --network halyard -p 8001:3000 --detach --name sample-project-server --env SAMPLE_PROJECT_API_PORT='3000' --env SAMPLE_PROJECT_ECHO='http://sample-project-echo:8080' --env SAMPLE_PROJECT_DATABASE='mongodb://sample-project-database:27017' robblovell/sample-project-server:1.3
docker run --network halyard -p 8002:8999 --detach --name sample-project-sockets --env SAMPLE_PROJECT_SOCKETS_PORT='8999' robblovell/sample-project-sockets:1.3
docker run --network halyard -p 8003:80 --detach --name sample-project-web --env SAMPLE_PROJECT_API_HOST='sample-project-server' --env SAMPLE_PROJECT_API_PORT='8001' --env SAMPLE_PROJECT_SOCKETS_HOST='sample-project-sockets' --env SAMPLE_PROJECT_SOCKETS_PORT='8002' robblovell/sample-project-web:1.3
```

Now open `https://localhost:8003`

Cleaning up:

```bash
docker kill sample-project-server sample-project-web sample-project-database sample-project-echo sample-project-sockets
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
export SAMPLE_PROJECT_DATABASE=mongodb://localhost:8003
export SAMPLE_PROJECT_DATABASE_DATABASE=database
export SAMPLE_PROJECT_API_HOST=node-service
export SAMPLE_PROJECT_API_PORT=8002
```

## Install

### Using Kubectl

```bash
kubectl apply -f ./k8s
```

```bash
kubectl apply -f ./k8s/sample-project-server-deployment.yaml
kubectl apply -f ./k8s/sample-project-server-service.yaml
kubectl apply -f ./k8s/sample-project-database-deployment.yaml
kubectl apply -f ./k8s/sample-project-database-service.yaml
kubectl apply -f ./k8s/sample-project-web-deployment.yaml
kubectl apply -f ./k8s/sample-project-web-service.yaml
```
### Using CodeZero

Legacy command
```bash
czctl install ./c6o/apps/sample-project-database.yaml --local -n halyard
czctl install ./c6o/apps/sample-project-echo.yaml --local -n halyard
czctl install ./c6o/apps/sample-project-server.yaml --local -n halyard
czctl install ./c6o/apps/sample-project-sockets.yaml --local -n halyard
czctl install ./c6o/apps/sample-project-web.yaml --local -n halyard
```

New command (not working yet):
```bash
czctl app install ./c6o/apps/sample-project-database.yaml --local --namespace=halyard
czctl app install ./c6o/apps/sample-project-echo.yaml --local --namespace=halyard
czctl app install ./c6o/apps/sample-project-server.yaml --local --namespace=halyard
czctl app install ./c6o/apps/sample-project-sockets.yaml --local --namespace=halyard
czctl app install ./c6o/apps/sample-project-web.yaml --local --namespace=halyard
```

Cleaning up 
```
kubectl delete app sample-project-database -n halyard
kubectl delete app sample-project-echo -n halyard
kubectl delete app sample-project-server -n halyard
kubectl delete app sample-project-web -n halyard
```

#### useful kubernetes commands:

```bash
kubectl rollout restart deployment sample-project-server -n halyard
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
sudo -E czctl deployment teleport sample-project-server -n halyard -f env.sh
```

Intercept
```bash
czctl service intercept sample-project-server -p 3000 -o 3010 -n halyard -x X-LOCAL:true
```

Curl Commands

```bash
curl http://sample-project-server:3000 --silent
curl http://sample-project-server:3010 --silent
curl http://sample-project-server:3020 --silent
curl -H "X-LOCAL:true" -L -X GET http://159.203.52.118/api
```

#### Based On: https://betterprogramming.pub/kubernetes-deployment-connect-your-front-end-to-your-back-end-with-nginx-7e4e7cfef177

