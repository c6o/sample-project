# CodeZero Halyard

A project for experimenting with developer productivity.

A minimum set of features for CI/CD experimentation:

* Front End
  * halyard-frontend
* 2 Back Ends
  * halyard-backend
  * echo-server from git@github.com:robblovell/echo-server.git that builds the docker container: robblovell/echo-server:2.2
* Database
  * halyard-database from a mongodb container

Technologies:

* Dockerized
* Kubernetes
* CodeZero

## Operating manifest items

```bash
docker run -d -h localhost -p 27017:27017 --name mongo mongo
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```

## Containerizing & Publishing

```bash
docker-compose build
docker-compose push
```

### manual builds:
```bash
docker build --tag halyard-backend ./halyard-backend:1.0
docker build --tag halyard-frontend ./halyard-frontend:1.0
```

### M1 build for remote systems:
```bash
docker build --tag robblovell/halyard-backend:1.1 --platform linux/amd64 ./halyard-backend
docker build --tag robblovell/halyard-frontend:1.1 --platform linux/amd64 ./halyard-frontend
docker push robblovell/halyard-backend:1.1
docker push robblovell/halyard-frontend:1.1
```

```bash
docker network create halyard
docker run --network halyard -p 27017:27017 --name halyard-database -d mongo:4.4.5
docker run --network halyard -p 8000:8080 --detach --name halyard-echo robblovell/echo-server:2.2
docker run --network halyard -p 8001:3000 --detach --name halyard-backend --env HALYARD_ECHO="http://halyard-echo:8080" --env HALYARD_DATABASE="mongodb://halyard-database:27017" robblovell/halyard-backend:1.1
docker run --network halyard -p 8002:80 --detach --name halyard-frontend --env HALYARD_BACKEND_HOST='halyard-backend:3000' robblovell/halyard-frontend:1.1
```

Now open `https://localhost:8002`

### For a public echo server: 
```bash
docker run --network halyard -p 8000:8080 --detach --name echo echo-server:1.0
```

### publish to docker hub

```bash
docker tag e3053bf8c609 robblovell/halyard-backend:1.1
docker tag f2cf0963cccd robblovell/halyard-frontend:1.1
docker push robblovell/halyard-backend:1.1
docker push robblovell/halyard-frontend:1.1
```
docker tag

Cleaning up:

```bash
docker kill halyard-backend halyard-frontend halyard-database halyard-echo
docker container prune -f && docker image prune -f 
docker network rm halyard
```

Helpful information:

[Useful article on docker networking](https://maximorlov.com/4-reasons-why-your-docker-containers-cant-talk-to-each-other/)

crib notes:
```bash
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
export HALYARD_BACKEND_HOST=node-service:8002
```

## Install

### Using Kubectl

```bash
kubectl apply -f ./k8s
```
 or

```bash
kubectl apply -f ./k8s/halyard-backend-deployment.yaml
kubectl apply -f ./k8s/halyard-backend-service.yaml
kubectl apply -f ./k8s/halyard-database-deployment.yaml
kubectl apply -f ./k8s/halyard-database-service.yaml
kubectl apply -f ./k8s/halyard-frontend-deployment.yaml
kubectl apply -f ./k8s/halyard-frontend-service.yaml
```
### Using CodeZero

```bash
czctl install ./c6o --local
```

or

```bash
czctl install ./c6o/halyard-backend.yaml --local
czctl install ./c6o/halyard-frontend.yaml --local
```

## Halyard Deployment process

### Teleport

### Impersonate

### Hijack

### Create environment

### Promote from environment to Environment

### Build/Publish/Deploy on Check In

#### Based On: https://betterprogramming.pub/kubernetes-deployment-connect-your-front-end-to-your-back-end-with-nginx-7e4e7cfef177

