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

![Diagram](http://www.plantuml.com/plantuml/svg/bPFHJzim4CQVwx_2z6L5MXDjZti22fEcCOR8q5uc8TU-j5uTNtG-mzZ4_pwd8RW5gOMyEFdk-zdtNUkZm8euDauSy18Qa1eeEb1-Yf6TzI24WvebeoIxMB8qba2pHI-4Lctt8e-TamG18scGNZKGv7fNUMTvAODgMWVJbl1t0kK4YaNnJ9ng93Wiv2cq3kyRy1maDfOPZAoHPB39RRNb-qA8T_BuRoGG1mPgww7_kam9v9Av3P_AajHTiKX7ntaCG1ezW-T2OrDUMQt8u8M55bov9gUNJdc-_dPU4ZXG0SgFqm-biO75WVNQHGEHN3wbfsRODEYBDWcxRDMwyTg2sMMz0Bv3Mbc_wAbpLEP4fROqKC-bq5_Z7CW3GtXAdgLNnZTQ1SMsN3s1ENsZ0WFrmRVwt3vbWxsPTLl_uHnjF_9y8BkmxrLLPkcujJtoQgAwrMyallZ56ubB7888fHb9Zgy3q5Yg8BlXR_zmSePDYnuy1p5piPltpGb6RnJTJtGll9VZJQ0NnuVodn0oFHVTxMgLXWpwSABqwioRX6vVgpKs4gCEt0evOL9GsrKYqXT12EFqEZuKOZJQcjyatEhFX9vJkUvMyERHAX-V5_uP4YIBJii-wpceEbbSMlPPJ-V9O1IhkGfxzwrGTyD0lG8E6-O7yI34YoisKQxRl9D--K4S1d85BazhOneo5RjQbdBqgxFgnyloqDRFAjTw84yYaxawX6_GBt1eQTtoq5Vk9eRk7zGLUqqSWJUnSVy1)

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
open http://localhost:3030
```

If you're not on a Mac, instead of the open command, you will need to launch a browser to [http://localhost:3000](http://localhost:3000).

Hit Ctrl-C to exit.

### Kubernetes Setup

For development, we recommend using either [Civo](https://civo.com) or [DigitalOcean](https://digitalocean.com) however, any k8s or k3s Kubernetes cluster will do. This project uses Persistent Volumes and either LoadBalancer services (digitalocean) or Traefik V2 (civo) for Ingress

Once your cluster is set up, you can install the sample project in cluster using:

```bash
kubectl create ns sample-project
kubectl -n sample-project apply -f ./k8s
```

This will install all the services and deployment but will not set up ingress.

If you're on k3s, install TraefikV2 and run the following:

```bash
kubectl -n sample-project apply -f ./k8s/traefik
```

If you're on k8s and have a LoadBalancer controller, run the following:

```bash
kubectl -n sample-project apply -f ./k8s/loadbalance
```

You will then need to obtain the TraefikV2 ingress IP address or the LoadBalancer IP address and go to http://IP-ADDRESS in a browser.
