# Sample Kubernetes Project

This project is here to help you explore and learn CodeZero and how various features can help greatly accelerate and enhance the Kubernetes development experience

This project may not contain all possible Kubernetes scenarios and may not illustrate all CodeZero features. If there is anything not covered in these samples, please feel free to submit a pull request and reach out to us on our [discussion forums](https://github.com/c6o/roadmap/discussions). We welcome new feature requests!

While the services in this project are written in NodeJS, CodeZero and Kubernetes are language agnostic. We chose JavaScript given its familiarity among a wide range of developers.

## Architecture

The project comprises of the following services and their equivalent deployments:

* Frontend
* Core
* Leaf
* Database
* Sockets

The following diagram assumes this project is deployed to the `sample-project` namespace and uses Traefik for ingress.

![Diagram](http://www.plantuml.com/plantuml/svg/bPJ1JXin48RFyLEON1gaXbLxx0a8LAfAAMABUgc49lOaSUErL_OOIYlUlJPEubr09DdBnZF_Pyy_uysn9t0K6iqzDAt6SUliRnJ43cY13NA1BcW4CxQ1j3B8_5AP5XmqF2tfeKLk7IqiOnfdnCbof-OBub8v5AIiOUmTF_aR7B83YRF8vDLLEdD1rFfFLUNW_cYkQ16cmQCJrX0QEXAsgQwL02VjfS8MTVL4Zgyq6BhvTb4vr0WUgu_Z3vLKFXQjZD11Od2wd9AfYMqQQuxQ67XBLglO1JLJAD-INYBTMnSxCS_KXGLv2h4iWIvpqVJNC4LdaD1ld9VGZlQb00-agkK6BEuRy8Gk6-_M-UoK3dixILl_eM9jE_Ay8MzXt-kwAg6JLcLaPwA-4tiINynyJ-BAoZs9CsorVLYv1q7MyU6DHpVau7aQM7_OFDwqrXeqvDb4XpIZsrCRZ0JtC18vy9uFkq0E3W_vFyPuV2wXGT-2m08QVmfYUMvaHFjVwXCsO8C4zXep8WSuKyj8n9L3xuVnv_2GiS6Wr_EHlnEVdJKKqxFqHYDNKhvwNkWdrc6KYFZQ9hr0c4M9ZgzjqhDf54WWc8BVkczjHMg65KkaZRMYxezl9B7TsMD1Th5PrBiuBUhNp9R9T9LzfsNdH_R8s8i_e17ej7CA_JBhu8gwHjsPTgSdl2IpvsA-aye6YzDEAhd9fafuFQIDXPH8cN8rDyKKgbHLxjdrUVtZjNJUzcTTSXdOr5h8VlQfpiQQkLsLbBkshgjK4tpwN6DoNVun6XaQ_Hy0)

## Getting Started

The goal of this project is to show you local development against an application running in a Kubernetes cluster. You will need to clone this repo and set up a Kubernetes cluster.

Getting to know Kubernetes is beyond the scope of this README however, you can check out our beginers articles on our [Blog](https://blog.codezero.io/tag/learning/).

### Local Setup

This project has been tested on MacOS (BigSur), Linux and Windows Subsystem for Linux.

This project requires NodeJS 16 or greater and all services can run locally with minimal requirements. After you clone the project, you can build and run all the services locally with the following steps:

```bash
yarn install
yarn start

# On MacOS
open http://localhost:3000
```

If you're not on a Mac, instead of the open command, you will need to launch a browser to [http://localhost:3000](http://localhost:3000).

Hit Ctrl-C to exit.

### Kubernetes Setup

For development, we recommend using either [Civo](https://civo.com) or [DigitalOcean](https://digitalocean.com) however, any k8s or k3s Kubernetes cluster will do. This project uses Persistent Volumes and either LoadBalancer services (digitalocean) or Traefik V2 (civo) for Ingress

Once your cluster is set up, you can install the sample project in cluster using:

```bash
kubectl create ns sample-project
kubectl -n sample project apply -f ./k8s
```

This will install all the services and deployment but will not set up ingress.

If you're on k3s, install TraefikV2 and run the following:

```bash
kubectl -n sample project apply -f ./k8s/traefik
```

If you're on k8s and have a LoadBalancer controller, run the following:

```bash
kubectl -n sample project apply -f ./k8s/loadbalance
```

You will then need to obtain the TraefikV2 ingress IP address or the LoadBalancer IP address and go to http://IP-ADDRESS in a browser.
