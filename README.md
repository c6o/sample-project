# CodeZero Halyard

A project for experimenting with developer productivity.

A minimum set of features for CI/CD experimentation:

* Front End
* Back End
* Database

Technologies:

* Dockerized
* Kubernetes

See: https://betterprogramming.pub/kubernetes-deployment-connect-your-front-end-to-your-back-end-with-nginx-7e4e7cfef177


## Operating manifest items

``` bash
docker run -d -h localhost -p 27017:27017 --name mongo mongo
docker run -d -p 5000:5000 --restart=always --name registry registry:2
```

## Containerizing & Publishing

``` bash
docker-compose build
docker-compose push
```

## Configuration

The following environment variables are required:

``` bash
export API_HOST=node-service
export API_PORT=3000
export BACKEND_MONGO_CONNECTION=mongodb://localhost:27017/database
```

## Install

### Using Kubectl

``` bash
kubectl apply -f ./k8s
```
 or

``` bash
kubectl apply -f ./k8s/backend-deployment.yaml
kubectl apply -f ./k8s/backend-service.yaml
kubectl apply -f ./k8s/database-deployment.yaml
kubectl apply -f ./k8s/database-service.yaml
kubectl apply -f ./k8s/frontend-deployment.yaml
kubectl apply -f ./k8s/frontend-service.yaml
```
### Using CodeZero

``` bash
czctl install ./c6o --local
```

or

``` bash
czctl install ./c6o/backend.yaml --local
czctl install ./c6o/frontend.yaml --local
```


