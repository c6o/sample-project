# Sample Kubernetes Project

This project is intended to help you explore and learn Codezero, and to show you how various features can help greatly accelerate and enhance your Kubernetes development experience.

**Note:** This project does not contain all possible Kubernetes scenarios, and does not illustrate all Codezero features. If you would like to see anything that is not covered in these samples, please submit a Pull Request and contact us on our [Discord](https://discord.gg/NVdS9zQu). We welcome new feature requests!

While the services in this project are written in NodeJS, Codezero and Kubernetes are language agnostic. We chose JavaScript given its familiarity among a wide range of developers.

## Architecture

The project comprises the following services and their equivalent deployments:

* Frontend
* Core
* Leaf
* Database
* Sockets
* External (dummy.restapiexample.com)

The following diagram assumes this project is deployed to the `sample-project` namespace and uses Traefik for ingress.

![Diagram](http://www.plantuml.com/plantuml/svg/bPFHJzim4CQVwx_2z6L5MXDjZti22fEcCOR8q5uc8TU-j5uTNtG-mzZ4_pwd8RW5gOMyEFdk-zdtNUkZm8euDauSy18Qa1eeEb1-Yf6TzI24WvebeoIxMB8qba2pHI-4Lctt8e-TamG18scGNZKGv7fNUMTvAODgMWVJbl1t0kK4YaNnJ9ng93Wiv2cq3kyRy1maDfOPZAoHPB39RRNb-qA8T_BuRoGG1mPgww7_kam9v9Av3P_AajHTiKX7ntaCG1ezW-T2OrDUMQt8u8M55bov9gUNJdc-_dPU4ZXG0SgFqm-biO75WVNQHGEHN3wbfsRODEYBDWcxRDMwyTg2sMMz0Bv3Mbc_wAbpLEP4fROqKC-bq5_Z7CW3GtXAdgLNnZTQ1SMsN3s1ENsZ0WFrmRVwt3vbWxsPTLl_uHnjF_9y8BkmxrLLPkcujJtoQgAwrMyallZ56ubB7888fHb9Zgy3q5Yg8BlXR_zmSePDYnuy1p5piPltpGb6RnJTJtGll9VZJQ0NnuVodn0oFHVTxMgLXWpwSABqwioRX6vVgpKs4gCEt0evOL9GsrKYqXT12EFqEZuKOZJQcjyatEhFX9vJkUvMyERHAX-V5_uP4YIBJii-wpceEbbSMlPPJ-V9O1IhkGfxzwrGTyD0lG8E6-O7yI34YoisKQxRl9D--K4S1d85BazhOneo5RjQbdBqgxFgnyloqDRFAjTw84yYaxawX6_GBt1eQTtoq5Vk9eRk7zGLUqqSWJUnSVy1)

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

We have put together a number of tutorials that can be found in our official [documentation](https://docs.codezero.io/). This Sample Project is used in all of the tutorials, and the [first tutorial](https://docs.codezero.io/tutorials/sample-project) walks you through using the Sample Project to perform local development against an application running in a Kubernetes cluster.
