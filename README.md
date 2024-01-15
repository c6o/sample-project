# Sample Kubernetes Project

This project is to help you explore and learn CodeZero, and to show you how various features can help greatly accelerate and enhance the Kubernetes development experience.

Please note that this project does not contain all possible Kubernetes scenarios, and does not illustrate all CodeZero features. If there is anything you would like to see that is not covered in these samples, please submit a pull request and reach out to us on our [discussion forums](https://github.com/c6o/roadmap/discussions). We welcome new feature requests!

While the services in this project are written in NodeJS, CodeZero and Kubernetes are language agnostic. We chose JavaScript given its familiarity among a wide range of developers.

## Architecture

The project comprises of the following services and their equivalent deployments:

* Frontend
* Core
* Leaf
* Database
* Sockets

The following diagram assumes this project is deployed to the `sample-project` namespace and uses Traefik for ingress.

![Diagram](https://docs.codezero.io/assets/images/sample-architecture-1bcc4623e8ca625c29ec4b8a262a4093.svg)

## Getting Started

### Dependancy
-Node.js >= v16
-MongoDB
```
docker run -d -p 27017:27017 --name codezero-mongo mongo:latest
```

After cloning the project, you can build and run all the services locally using yarn:

```bash
yarn install
yarn start
```

Open [http://localhost:3030](http://localhost:3030) in a browser to view the running services.

## Tutorials

We have put together a number of tutorials that can be found in our official [documentation](https://docs.codezero.io/). This Sample Project is used in all of the tutorials, and the [first tutorial](https://docs.codezero.io/#/tutorials/sample-project) walks you through using the Sample Project to perform local development against an application running in a Kubernetes cluster.
